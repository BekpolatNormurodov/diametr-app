import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * In-memory brake on panel password guessing (POST /auth/login), per backend
 * replica, no schema change.
 *
 * Failures are counted per (client IP + login) and per client IP. Only the
 * IP-keyed buckets ever block, so nobody can lock a shop owner out of their
 * account by failing logins with the owner's phone from somewhere else: the
 * owner's own IP stays unaffected. A successful login clears its bucket.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_LOGIN_AND_IP = 10;
const MAX_FAILS_PER_IP = 50;
const MAX_KEYS = 20_000;

export const LOGIN_THROTTLED_MESSAGE =
  "Juda ko'p noto'g'ri urinish. 15 daqiqadan so'ng qayta urinib ko'ring";

type Bucket = { count: number; since: number };

export class LoginThrottle {
  private readonly buckets = new Map<string, Bucket>();

  private live(key: string, now: number): Bucket | undefined {
    const b = this.buckets.get(key);
    if (b && now - b.since >= WINDOW_MS) {
      this.buckets.delete(key);
      return undefined;
    }
    return b;
  }

  private bump(key: string, now: number) {
    const b = this.live(key, now);
    if (b) b.count += 1;
    else this.buckets.set(key, { count: 1, since: now });
  }

  private prune(now: number) {
    if (this.buckets.size < MAX_KEYS) return;
    for (const [key, b] of this.buckets) {
      if (now - b.since >= WINDOW_MS) this.buckets.delete(key);
    }
    // Still full (a flood of distinct keys): drop the oldest half.
    if (this.buckets.size >= MAX_KEYS) {
      let drop = Math.floor(this.buckets.size / 2);
      for (const key of this.buckets.keys()) {
        if (drop-- <= 0) break;
        this.buckets.delete(key);
      }
    }
  }

  /** Throws 429 when this client already failed too often. */
  assertAllowed(ip: string, login: string, now = Date.now()) {
    const pair = this.live(`p|${ip}|${login}`, now);
    const perIp = this.live(`i|${ip}`, now);
    if (
      (pair && pair.count >= MAX_FAILS_PER_LOGIN_AND_IP) ||
      (perIp && perIp.count >= MAX_FAILS_PER_IP)
    ) {
      throw new HttpException(
        { message: LOGIN_THROTTLED_MESSAGE },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(ip: string, login: string, now = Date.now()) {
    this.prune(now);
    this.bump(`p|${ip}|${login}`, now);
    this.bump(`i|${ip}`, now);
  }

  recordSuccess(ip: string, login: string) {
    this.buckets.delete(`p|${ip}|${login}`);
  }
}

/** Client IP as forwarded by nginx (X-Real-IP), else the socket peer. */
export function clientIp(req: any): string {
  const real = req?.headers?.['x-real-ip'];
  const fwd = req?.headers?.['x-forwarded-for'];
  const first = (v: unknown) =>
    (Array.isArray(v) ? v[0] : typeof v === 'string' ? v : '')
      .split(',')[0]
      .trim();
  return first(real) || first(fwd) || req?.ip || req?.socket?.remoteAddress || '-';
}
