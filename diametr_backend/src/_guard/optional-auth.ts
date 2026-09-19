import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

/**
 * For PUBLIC routes that return more fields to the platform admin: resolves
 * the role of an optional `Authorization: Bearer <jwt>` header. Never throws —
 * a missing, invalid, expired or wrong-role token simply yields `null`, so an
 * anonymous visitor (or a customer with a stale token) still gets the public
 * answer instead of a 401 that would end their session.
 *
 * nginx never caches a request that carries Authorization
 * (proxy_no_cache / proxy_cache_bypass $http_authorization), so a fuller
 * SUPER answer can not leak to anonymous visitors through the API cache.
 */
export async function isSuperRequest(
  jwt: JwtService,
  prisma: PrismaClientService,
  authorization?: string | string[],
): Promise<boolean> {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (typeof header !== 'string') return false;
  const [type, token] = header.trim().split(/\s+/);
  if (!token || !/^bearer$/i.test(type ?? '')) return false;
  try {
    const payload: { role?: Role; user_id?: number } =
      await jwt.verifyAsync(token);
    if (payload?.role !== Role.SUPER || !Number.isInteger(payload.user_id)) {
      return false;
    }
    const row = await prisma.super.findUnique({
      where: { id: payload.user_id },
      select: { id: true },
    });
    return !!row;
  } catch {
    return false;
  }
}
