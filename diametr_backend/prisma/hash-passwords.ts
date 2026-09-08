/**
 * One-off migration: bcrypt-hash every plain-text password still sitting in the
 * super / admin / worker tables.
 *
 * Passwords used to be stored in clear text (and compared with `!==`). This
 * rewrites the existing rows. It is idempotent: a row whose password already
 * starts with `$2` is skipped, so running it twice is harmless.
 *
 *   docker exec diametr-backend-1 node dist/prisma/hash-passwords.js
 *   # or, locally:  npx ts-node prisma/hash-passwords.ts
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword, isHashed } from '../src/_utils/password';

const prisma = new PrismaClient();

async function migrateTable(
  name: 'super' | 'admin' | 'worker',
  rows: { id: number; password: string | null }[],
  update: (id: number, password: string) => Promise<unknown>,
) {
  let hashed = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.password) {
      skipped++;
      continue;
    }
    if (isHashed(row.password)) {
      skipped++;
      continue;
    }
    await update(row.id, await hashPassword(row.password));
    hashed++;
  }
  console.log(`  ${name}: hashed ${hashed}, skipped ${skipped} (already hashed / empty)`);
}

async function main() {
  console.log('Hashing plain-text passwords...');

  await migrateTable(
    'super',
    await prisma.super.findMany({ select: { id: true, password: true } }),
    (id, password) => prisma.super.update({ where: { id }, data: { password } }),
  );
  await migrateTable(
    'admin',
    await prisma.admin.findMany({ select: { id: true, password: true } }),
    (id, password) => prisma.admin.update({ where: { id }, data: { password } }),
  );
  await migrateTable(
    'worker',
    await prisma.worker.findMany({ select: { id: true, password: true } }),
    (id, password) => prisma.worker.update({ where: { id }, data: { password } }),
  );

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
