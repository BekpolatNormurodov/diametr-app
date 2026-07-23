// bcryptjs is pure JS (no native addon), so it survives the production image's
// `npm ci --ignore-scripts`. We load it with require and pin the tiny surface we
// use inline, so the build never depends on @types/bcryptjs being resolvable —
// which it was not inside the Docker builder.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt: {
  hash(data: string, saltOrRounds: number): Promise<string>;
  compare(data: string, encrypted: string): Promise<boolean>;
} = require('bcryptjs');

const ROUNDS = 10;

/**
 * Passwords used to be stored in plain text and compared with `!==`.
 * They are bcrypt hashes now, but rows written before the migration may still
 * hold plain text, so `verifyPassword` accepts both and the caller upgrades the
 * row on a successful legacy login. Once `hash-passwords.ts` has run and every
 * row starts with `$2`, the legacy branch is dead code and can be deleted.
 */
export function isHashed(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && /^\$2[aby]\$/.test(stored);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

/**
 * Returns whether the password matches, and whether the stored value was a
 * legacy plain-text one (so the caller can rewrite it as a hash).
 */
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (typeof stored !== 'string' || stored.length === 0) {
    // Still spend the time a real comparison would, so a missing password is
    // not distinguishable from a wrong one by response timing.
    await bcrypt.compare(plain, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return { ok: false, needsUpgrade: false };
  }

  if (isHashed(stored)) {
    return { ok: await bcrypt.compare(plain, stored), needsUpgrade: false };
  }

  const ok = safeEqual(plain, stored);
  return { ok, needsUpgrade: ok };
}

/** Length-independent constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Strips `password` from an entity (or a list of them) before it goes over the
 * wire. The admin list endpoint used to return every stored password.
 */
export function withoutPassword<T extends Record<string, any>>(entity: T): Omit<T, 'password'>;
export function withoutPassword<T extends Record<string, any>>(entity: T[]): Omit<T, 'password'>[];
export function withoutPassword(entity: any): any {
  if (Array.isArray(entity)) return entity.map(withoutPassword);
  if (!entity || typeof entity !== 'object') return entity;
  const { password: _password, ...rest } = entity;
  return rest;
}
