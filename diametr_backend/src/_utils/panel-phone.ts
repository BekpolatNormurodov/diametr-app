import { BadRequestException } from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

/**
 * Panel logins (POST /auth/login) look a phone up in the admin, super and
 * worker tables. Each table only has its OWN unique index, so the same phone
 * in two tables would make one of the accounts unreachable (the login finds
 * the other row and rejects the password). Every write that sets a panel
 * account's phone must therefore check all three tables.
 *
 * `except` skips the row being updated.
 */
export async function assertPanelPhoneFree(
  prisma: PrismaClientService,
  phone: string | null | undefined,
  except?: { table: 'admin' | 'worker'; id: number },
): Promise<void> {
  if (!phone) return;
  // The login normalises to a leading '+', so compare both spellings.
  const digits = String(phone).trim().replace(/^\+/, '');
  if (!digits) return;
  const variants = Array.from(new Set([String(phone).trim(), digits, '+' + digits]));
  const where = { phone: { in: variants } };

  const [admin, superRow, worker] = await Promise.all([
    prisma.admin.findFirst({
      where: {
        ...where,
        ...(except?.table === 'admin' ? { id: { not: except.id } } : {}),
      },
      select: { id: true },
    }),
    prisma.super.findFirst({ where, select: { id: true } }),
    prisma.worker.findFirst({
      where: {
        ...where,
        ...(except?.table === 'worker' ? { id: { not: except.id } } : {}),
      },
      select: { id: true },
    }),
  ]);

  if (admin || superRow || worker) {
    throw new BadRequestException('This phone is used');
  }
}
