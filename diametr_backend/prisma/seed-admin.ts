/**
 * seed-admin.ts — Admin va Super foydalanuvchilar uchun alohida seed
 * Ishlatish: npm run seed:admin
 */
import { PrismaClient, WORK_STATUS } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱  Admin seed boshlandi...\n')

  // ─── 1. SUPER yaratish ────────────────────────────────────────────────────
  const superUser = await prisma.super.upsert({
    where: { phone: '+998900000001' },
    update: {},
    create: {
      fullname: 'Super Admin',
      phone: '+998900000001',
      password: 'super1234',
    },
  })
  console.log(`✅  Super: ${superUser.fullname}  |  tel: ${superUser.phone}  |  parol: super1234`)

  // ─── 2. Test do'kon (agar mavjud bo'lmasa) ────────────────────────────────
  let testShop = await prisma.shop.findFirst()
  if (!testShop) {
    testShop = await prisma.shop.create({
      data: {
        name: 'Test Dokon',
        address: 'Toshkent sh, Amir Temur 1',
        work_status: WORK_STATUS.WORKING,
        expired: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })
    console.log(`🏪  Test do'kon yaratildi: ${testShop.name}`)
  } else {
    console.log(`🏪  Mavjud do'kon ishlatildi: ${testShop.name}  (id=${testShop.id})`)
  }

  // ─── 3. ADMIN yaratish ────────────────────────────────────────────────────
  const admin = await prisma.admin.upsert({
    where: { phone: '+998900000002' },
    update: {},
    create: {
      fullname: 'Bosh Admin',
      phone: '+998900000002',
      password: 'admin1234',
      shop_id: testShop.id,
    },
  })
  console.log(`✅  Admin: ${admin.fullname}  |  tel: ${admin.phone}  |  parol: admin1234  |  do'kon: ${testShop.name}`)

  // ─── Qo'shimcha adminlar (zarur bo'lsa) ──────────────────────────────────
  const extra = [
    { fullname: 'Mirzo Admin', phone: '+998901112233', password: 'mirzo1234', shop_id: testShop.id },
    { fullname: 'Shirin Admin', phone: '+998902223344', password: 'shirin1234', shop_id: testShop.id },
  ]
  for (const a of extra) {
    const created = await prisma.admin.upsert({
      where: { phone: a.phone },
      update: {},
      create: a,
    })
    console.log(`   ↳  ${created.fullname}  |  ${created.phone}  |  ${a.password}`)
  }

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║              KIRISH MA\'LUMOTLARI                 ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Super  →  +998900000001  /  super1234           ║')
  console.log('║  Admin  →  +998900000002  /  admin1234           ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log('\nDashboard login: raqamni + belgisisiz kiriting')
  console.log('Masalan: 998900000001  →  parol: super1234\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
