/**
 * seed.ts — Diametr stroy-market uchun to'liq seed
 *
 * npm run seed
 *
 * Yaratadi:
 *   • Regionlar (Toshkent tumanlari)
 *   • O'lchov birliklari (UnitType)
 *   • Kategoriyalar (qurilish materiallari)
 *   • Har bir kategoriyaga tovarlar (Product)
 *   • Har bir tovarga variantlar (ProductItem)
 *   • Test do'konlar + shopProduct
 */

import { PrismaClient, WORK_STATUS } from '@prisma/client';

const prisma = new PrismaClient();

/* ═══════════════════════════════════════════════════════════════
   1. REGIONLAR
   ═══════════════════════════════════════════════════════════════ */
const regions = [
  'Yunusobod',
 
 
 
  'Chilonzor',
 
 
 
  "Mirzo Ulug
' bek",
 
  'Shayxontohur',
  'Yakkasaroy',
  'Uchtepa',
  'Olmazar',
  'Sergeli',
  'Bektemir',
  'Yashnobod',
  'Mirobod',
];

/* ═══════════════════════════════════════════════════════════════
   2. O'LCHOV BIRLI
   ═══════════════════════════════════════════════════════════════ */
const unitTypes = [
  { name: 'Dona', symbol: 'dona' },
  { name: 'Kilogramm', symbol: 'kg' },
  { name: 'Tonna', symbol: 't' },
  { name: 'Litr', symbol: 'L' },
  { name: 'Metr', symbol: 'm' },
  { name: 'Kvadrat metr', symbol: 'm²' },
  { name: "O'lcham (x*y)", symbol: 'x*y' },
  { name: "O'lcham (x*y*z)", symbol: 'x*y*z' },
];

/* ═══════════════════════════════════════════════════════════════
   3. KATEGORIYALAR + TOVARLAR + VARIANTLAR
   ═══════════════════════════════════════════════════════════════

   unitRef  → unitTypes[] dagi symbol orqali bog'lanadi
   Har bir item: { name?, color?, value?, size?, unitRef? }
   ─ value + unitRef  = masalan 50 kg, 25 kg
   ─ color            = "#HEX" rang
   ─ size             = "120x60" o'lcham
*/

interface ItemDef {
  name?: string;
  color?: string;
  value?: number;
  size?: string;
  unitRef?: string; // -> unitTypes.symbol
}

interface ProductDef {
  name_uz: string;
  name_ru: string;
  unitRef: string; // product-level unit
  items: ItemDef[];
}

interface CategoryDef {
  name_uz: string;
  name_ru: string;
  products: ProductDef[];
}

       
       
const categories: CategoryDef[] = [
  /* ────────── 1. Tsement va qrishma ────────── */
  {
    name_uz: 'Tsement va qorishma',
    name_ru: 'Цемент и смеси',
    products: [
      {
       
       
        name_uz: 'Tsement M400',
        name_ru: 'Цемент М400',
        unitRef: 'kg',
        items: [
          { name: 'Qop 50 kg', value: 50 },
          { name: 'Qop 25 kg', value: 25 },
        ],
       
       
      },
      {
        name_uz: 'Tsement M500',
        name_ru: 'Цемент М500',
        unitRef: 'kg',
        items: [
          { name: 'Qop 50 kg', 
v       alue: 50 },
       
          { name: 'Qop 25 kg', value: 25 },
        ],
      },
      {
        name_uz: 'Gips qorishma',
        name_ru: 'Гипсовая смесь',
        unitRef: 'kg',
       
       
        items: [
          { name: 'Standart', ue: 30 },
          { name: 'Kichik qop', alue: 10 },
        ],
      },
      {
        name_uz: 'Shtukaturka',
       
       
        name_ru: 'Штукатурка',
        unitRef: 'kg',
        items: [
          { name: 'Standart', value: 25 },
          { name: 'Kichik', value: 5 },
        ],
      },
      {
        name_uz: 'Plitka kleyi',
        name_ru: 'Плиточный клей',
        unitRef: 'kg',
        items: [
          { name: 'Standart', value: 25 },
          { name: 'Kichik qop', value: 10 },
        ],
       
       
      },ame_uz: 'Quruq qorame_ru: 'ПескобетunitRef: 'kg',
        items: [
          { name: 'Qop 40 kg', value: 40 },
          { name: 'Qop 25 kg', val
       ue: 25 },
       
        ],

  /* ────────── 2. G'isht va bloklar ────────── */
  {
       
       
    name_uz: "G'isht va bloklar",
    name_ru: 'Кирпич и блоки',
    products: [
      {
        name_uz: "Qizil g'isht",
        name_ru: 'Красный кирпич',
        unitRef: 'dona',
        items: [{ name: 'M10
       0' }, { name: 'M150' 
       }, { name: 'M200' }],
      },
      {
        name_uz: "Silikat g'isht",
        name_ru: 'Силикатный кирпич',
        unitRef: 'dona',
        items: [{ name: 'Oq M150' }, { name: 'Oq M200' }],
      },
       
       
      {
        name_uz: 'Gaz-beton blok',
        name_ru: 'Газобетонный лок',
        unitRef: 'x*y*z',
        items: [
          { name: '200×300×600', size: '200x300x600' },
          { name: '100×300×600', size: '100x300x600' },
          { name: '150×300×600', size: '150x300x600' },
        ],
      },
      {
        name_uz: 'Penoblok',
        name_ru: 'Пеноблок',
        unitRef: 'x*y*z',
        items: [
       
       
          { name: '200×300×600', size: '200x300x600' },
          { name: '100×300×600' size: '100x300x600' },
        ],
      },
      {
        name_uz: 'Keramzitoblok',
        name_ru: 'Керамзитоблок',
        unitRef: 'x*y*z',
        items: [
          { name: '190×190×390',
        size: '190x190x390' },
       
          { name: '90×190×390', size: '90x190x390' },
        ],
      },
    ],
  },

  /* ────────── 3. Metall mahsulotlar ────────── */
  {
    name_uz: 'Metall mahsulotla
     r  ',
       
    name_ru: 'Металлопродукция',
    products: [
      {
        name_uz: 'Armatura',
        name_ru: 'Арматура',
        unitRef: 'm',
        items: [
          { name: 'A400 ∅8 mm', value: 8 },
          { name:"'A400 ∅10mm'" 
     v  alue: 10 },
       
          { name: 'A400 ∅12 mm', value: 12 },
          { name: 'A400 ∅14 mm', vlue: 14 },
          { name: 'A400 ∅16 mm', value: 16 },
        ],
      },
      {
        name_uz: 'Profil truba',
        name_ru: 'Профильная труба',
        unitRef: 'm',
        items: [
          { name: '20×20 mm', size: '20x20' },
          { name: '40×20 mm', size: '40x20' },
          { name: '40×40 mm', size: '40x40' },
          { name: '60×40 mm', size: '60x40' },
        ],""
       
       
      },
      {
        name_uz: 'List metall',
        name_ru: 'Листовой металл',
        unitRef: 'm²',
        items: [
          { name: '0.5 mm qalinlik', value: 0.5 },
          { name: '0.7 mm qalinli
    k   ', value: 0.7 },
       
          { name: '1.0 mm qalinlik', value: 1.0 },
          { name: '2.0 mm qalinlik', value: 2.0 },
        ],
      },
      {
        name_uz: "Setka (to'r)",
        name_ru: 'Сетка',
        unitRef: 'm²',
       
       
        items: [
          { name: '50×50  (∅3)', size: '50x50' },
          { name: '100×100 m (∅4)', size: '100x100' },
        ],
      },
    ],
  },

  /* ────────── 4. Yog'och va
        fanera ────────── */
       
  {
    name_uz: "Yog'och va fera",
    name_ru: 'Древесина и фнера',
    products: [
      {
        name_uz: "Brus (yog'ochdan)",
        name_ru: 'Брус',
        unitRef: 'm',
        items: [
          { name: '50×50 mm', size: '50x50' },
          { name: '100×100 mm', size: '100x100' },
          { name: '150×150 mm', size: '150x150' },
        ],
      },
      {
        name_uz: "Doska (txta)',"
       
       
        name_ru: 'Доска обрезная',
        unitRef: 'm',
        items: [
          { name: '25×150 m', size: '25x150' },
          { name: '40×150 mm', size: '40x150' },
          { name: '50×200 mm', size: '50x200' },
        ],
      },
      {""
       
       
        name_uz: 'Fanera',
        name_ru: 'Фанера
        unitRef: 'm²',
        items: [
          { name: '4 mm', value: 4 },
          { name: '10 mm', value: 10 },
          { name: '18 mm', value: 18 },
          { name: '21 m
     m  ', value: 21 },
       
        ],
      },
      {
        name_uz: 'OSB plita',
        name_ru: 'OSB плита',
        unitRef: 'm²',
        items: [
       
       
          { name: '9 mm', value: 9 },
          { name: '12 mm', value: 12 },
          { name: '18 mm', value: 18 },
        ],
      },
    ],
  },""
       
       

  /* ────────── 5. Bo'yo laklar ────────── */
  {
    name_uz: "Bo'yoq va lakar",
    name_ru: 'Крас"и  л"ки,
    products: [
      {
        name_uz: "Devor bo'yoqi (ichki)",
        name_ru: 'Краска интерьерная',
        unitRef: 'L',
        items: [
          { name: 'Oq', color: '#FFFFFF', value: 10 },
          { name: 'Oq', color: '#FFFFFF', value: 5 },
          { name: 'Krem', color: '#FFFDD0', value: 10 },
          { name: 'Kulrang', color: '#808080', value: 10 },
        ],
      },
      {
       
       
        name_uz: "Fasad bo'yoqi",
        name_ru: 'Фасадная краска
        unitRef: 'L',
        items: [
          { name: 'Oq', color: '#FFFFFF', value: 20 },
          { name: 'Sariq', color: '#FFD700', value: 20 },
          { name: 'Havorang', color: '#87CEEB', value: 20 },
        ],
       
       
      },
      {
        name_uz: 'Lak',
        name_ru: 'Лак',
        unitRef: 'L',
        items: [
          { name: 'Shaffof', value: 1 },
       
       
          { name: 'Shaffof', value: 5 },
        ],
      },
      {
        name_uz: 'Grunt (astar)',
        name_ru: 'Грунтовка',
        unitRef: 'L',
        items: [
       
       
          { name: 'Universal', value: 5 },
          { name: 'Universal', val: 10 },
        ],
      },
      {
        name_uz: "Emal bo'yoq",
        name_ru: 'Эмаль',
        unitRef: 'L',
        items: [
          { name: 'Oq', color: '#FFFFFF', value: 2.5 },
          { name: 'Qora', color: '#000000', value: 2.5 },
          { name: 'Qizil', color: '#FF0000', value: 2.5 },
          { name: "Ko'k", color: '#0000FF', value: 2.5 },
          { name: 'Yashil', color: '#008000', value: 2.5 },
        ],
       
       
      },
    ],
  },

  /* ────────── 6. Santexnika ────────── */
  {
    name_uz: 'Santexnika',
    name_ru: 'Сантехника',
    products: [
       
       
      {
        name_uz: 'Unitaz',
        name_ru: 'Унитаз',
        unitRef: 'dona',
        items: [
          { name: 'Oq standart', color: '#FFFFFF' },
          { name: 'Oq premium', color: '#FFFFFF' },
          { name: 'Suyak rang', 
c       olor: '#FAEBD7' },
       
        ],
      },
      {
        name_uz: 'Rakovina (lavabo)',
        name_ru: 'Раковина',
        unitRef: 'dona',
        items: [""
       
       
          { name{ name: 'Oq 60 s  
        name_uz: 'Polipropilen truba (PPR)',
        name_ru: 'Труба ПП',
        unitRef: 'm',
        items: [
          { name: '∅20 mm', value: 20 },
          { name: '∅25 mm', value: 25 },
          { name: '∅32 mm', value: 32 },
        ],
      },
      {
        name_uz: 'Kran (aralashtirgich)',
       
       
        name_ru: 'Смеситель',
        unitRef: 'dona',
        items: [
          { name: 'Oshxona uchun', color: '#C0C0C0' },
          { name: 'Hammom uchun', color: '#C0C0C0' },
        ],
      },
    ],
       
       
  },

  /* ────────── 7. Elektr jihozlari ────────── */
  {
    name_uz: 'Elektr jihozlari',
    name_ru: 'Электрика',
    products: [
      {
       
       
        name_uz: 'Kabel (NYM)',
        name_ru: '"абль"NY,
        unitRef: 'm',
        items: [
          { name: '2×1.5 mm²', value: 1.5 },
          { name: '2×2.5 mm²', value: 2.5 },
          { name: '3×1.5 mm²', value: 1.5 },
          { name: '3×2.5 mm²', value: 2.5 },
        ],
      },
      {
        name_uz: 'Rozetka',
        name_ru: 'Розетка',
        unitRef: 'dona',
        items: [
       
       
          { name: 'Oq (oddiy)', color: '#FFFFFF' },
          { name: 'Kumush',olor: '#C0C0C0' },
          { name: 'Suyak rang', color: '#FAEBD7' },
        ],
      },
      {
        name_uz: 'Vyklyuchatel',
        name_ru: 'Выключатель'
,       
       
        unitRef: 'dona',
        items: [
          { name: "Bir tumal" (q)', color: '#FFFFFF' },
          { name: 'Ikki tugmali (oq)', color: '#FFFFFF' },
        ],
      },
      {
       
       
        name_uz:me_ru: '"втомт'," itRef: '"ona'"items: [{ name: '16A' }, { name: '25A' }, { name: '32A' }],
      },
    ],
  },
       
       

  /* ────────── 8. Plitka va kaf ────────── */
  {
    name_uz: 'Plitka va kafel',
    name_ru: 'Плитка и кафель',
    products: [
      {
        name_uz: 'Pol plitka (keramogranit)',
        name_ru: 'Керамогранит',
        unitRef: 'm²',
        items: [
          { name: 'Kulrang 60×60', color: '#808080', size: '60x60' },
          { name: 'Bej 60×60', color: '#F5F5DC', size: '60x60' },
          { name: 'Marmarsifat 80×80', color: '#F0EAD6', size: '80x80' },
        ],
       
       
      },
      {
        name_uz: 'Devor plika (kafel)',
        name_ru: 'Кафель настенный',
        unitRef: 'm²',
        items: [
          { name: 'Oq 25×40', color: '#FFFFFF', size: '25x40' },
          { name: 'Havorang 30×6
0       ', color: '#87CEEB', size: '
3       0x60' },
          { name: 'Bej 30×60', color: '#F5F5DC', size: '30x60' },
        ],
      },
      {
        name_uz: 'Mosaika',
        name_ru: 'Мозаика',
        unitRef: 'm²',
       
       
        items: [
          { name: "Ko'k", clor: '#0000FF' },
          { name: 'Oq', colr: '#FFFFFF' },
        ],
      },
    ],
  },

  /* ────────── 9. Tom yopish (krovlya) ────────── */
  {
    name_uz: 'Tom yopish materiallari',
    name_ru: 'Кровля',
    products: [
      {
        name_uz: 'Metallocherepit
       sa',
       
        name_ru: 'Металлочерепица',
        unitRef: 'm²',
        items: [
          { name: 'Qizil', color: '#8B0000' },
          { name: 'Jigarrang', color: '#8B4513' },
          { name: 'Yashil', color: '#006400' },
        ],
       
       
      },
      {
        name_uz: 'Profnastil',
        name_ru: 'Профнастил',
        unitRef: 'm²',
        items: [
          { name: 'C8 (kumus
       h)', color: '#C0C0C0'
        },
          { name
      {
        name_uz: 'Shifer',
        name_ru: 'Шифер',
        unitRef: 'dona',
        items: [{ name: "8 to'lqinli" }, { name: "6 to'lqinli" }],
      },
      {
        name_uz: 'Gidroizolyatsiya (rulon)',
        name_ru: 'Гидроизоляция',
        unitRef: 'm²',
        items: [
       
       
          { name: 'Texnonikol', value: 10 },
          { name: 'Bikrost', v 10 },
        ],""
      },
    ],
  },

  /* ────────── 10. Izolyatsiya va utepli
       tel ────────── */
       
  {
    name_uz: 'Izolyatsiya materiallai',
    name_ru: 'Изоляция и утепление'
    products: [
      {
        name_uz: 'Penoplast (EPS)',
        name_ru: 'Пенопласт',
       
       
        unitRef: 'm²',
        items: [
          { name: '20 mm', value: 20 },
          { name: '50 mm', value: 50 },
          { name: '100 mm', value: 100 },
        ],
      },
      {
        name_uz: 'Mineral vata',
        name_ru: 'Минеральная вата',
        unitRef: 'm²',
        items: [
          { name: '50 mm', value: 50 },
          { name: '100 mm', value: 100 },
        ],
      },""
      {
        name_uz: 'Penopolistirol (XPS)',
        name_ru: 'Экструдированный полистирол',
        unitRef: 'm²',
        items: [
          { name: '30 mm', value: 30 },
          { name: '50 mm', value: 50 },
        ],
      },
    ],
  },

  /* ────────── 11. Qum, shag'al, to'ldirgichlar ────────── */
  {
    name_uz: "Qum va shag'al",
    name_ru: '
       Песок и щебень',,
     
    products: [
      {
        name_uz: 'Qurilish qumi',
        name_ru: 'Песок строительный',
        unitRef: 't',
        items: [
          { name: 'Yuvulgan qum', value: 1 },
          { name: 'Oddiy qum', value: 1 },
        ],
      },
      {
     ,
   
        name_uz: "Shag'al (shcheben)",
        name_ru: 'Щебень',
        unitRef: 't',
        items: [
          { name: 'Fr. 5–20 mm', value: 1 },
          { name: 'Fr. 20–40 mm', value: 1 },
        ],
      },
      {
        name_uz: 'Keramzit',
        name_ru: 'Керамзит',
        unitRef: 'L
   ',
   
        items: [{ name: 'Qop 50 L', value: 50 }],
      },
    ],
  },
     ,
   

  /* ────────── 12. Eshik va deraza ────────── */
  {
    name_uz: 'Eshik va derazalar',
    name_ru: 'Двери и окна',
    products: [
      {
        name_uz: 'Ichki eshik (MDF)',
        name_ru: 'Межкомнатная дверь',
        unitRef: 'dona',
        items: [
          { name: 'Oq 80×200', color: '#FFFFFF', size: '80x200' },
          { name: "Yong'oq 80×200", color: '#8B4513', size: '80x200' },
          { name: 'Wenge 80×200', color: '#3C1414', size: '80x200' },
        ],
      },
      {
        name_uz: 'Kirish eshik (metall)',
        name_ru: 'Входная дверь',
        unitRef: 'dona',
        items: [
          { name: 'Standart 86×205', size: '86x205' },
          { name: 'Premium 96×205', size: '96x205' },
        ],
      },
      {
        name_uz: 'Plastik deraza',
        name_ru: 'Пластиковое окно',
        unitRef: 'dona',
        items: [
          { name: '1-kamerali 140×120', size: '140x120' },
          { name: '2-kamerali 140×120', size: '140x120' },
          { name: '2-kamerali 180×120', size: '180x120' },
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   4. TEST DO'KONLAR
   ═══════════════════════════════════════════════════════════════ */
const shops = [
               
               
  { name: 'Oltin Uy Stroy', address: 'Toshkent, Chilonzor 9-kvartal' },
  { name: 'Mega Stroy Market', address: "Toshkent, Yunusobod, Bog'ishamol" },
  { name: 'Qurilish Dunyosi', address: 'Toshkent, Sergeli, Yangi Sergeli' },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        🌱  DIAMETR SEED BOSHLANDI               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
""
  /* ── Regionlar ──────────────────────────────────────────── */
  console.log('📍  Regionlar...');
  for (const name of regions) {
    await prisma.region.upsert({
      where: {
        id: (await prisma.region.findFirst({ where: { name } }))?.id ?? 0,
      },
      update: {},
      create: { name },
    });
  }
  console.log(`   ✅ ${regions.length} ta region\n`);

  /* ── O'lchov birliklari ─────────────────────────────────── */
  console.log("📏  O'lchov birliklari...");
  const expectedSymbols = new Set(unitTypes.map((unit) => unit.symbol));
  const existingUnits = await prisma.unitType.findMany({ orderBy: { id: 'asc' } });
  const unexpectedIds = existingUnits
    .filter((unit) => !expectedSymbols.has(unit.symbol))
    .map((unit) => unit.id);

  if (unexpectedIds.length > 0) {
    await prisma.product.updateMany({
      where: { unit_type_id: { in: unexpectedIds } },
      data: { unit_type_id: null },
    });
    await prisma.productItem.updateMany({
      where: { unit_type_id: { in: unexpectedIds } },
      data: { unit_type_id: null },
    });
    await prisma.unitType.deleteMany({ where: { id: { in: unexpectedIds } } });
    console.log(`   ⚠️ ${unexpectedIds.length} ta eski noto'g'ri unit type o'chirildi va referenslar null qilindi`);
  }

  const unitMap = new Map<string, number>();
  for (const ut of unitTypes) {
    const duplicates = await prisma.unitType.findMany({
      where: { symbol: ut.symbol },
      orderBy: { id: 'asc' },
    });

    if (duplicates.length === 0) {
      const created = await prisma.unitType.create({ data: ut });
      unitMap.set(ut.symbol, created.id);
      continue;
    }

    const [keep, ...remove] = duplicates;
    if (remove.length > 0) {
      const removeIds = remove.map((unit) => unit.id);
      await prisma.product.updateMany({
        where: { unit_type_id: { in: removeIds } },
        data: { unit_type_id: null },
      });
      await prisma.productItem.updateMany({
        where: { unit_type_id: { in: removeIds } },
        data: { unit_type_id: null },
      });
      await prisma.unitType.deleteMany({ where: { id: { in: removeIds } } });
      console.log(`   ⚠️ duplicate unit type IDlar ${removeIds.join(', ')} o'chirildi (${ut.symbol})`);
    }

    await prisma.unitType.update({
      where: { id: keep.id },
      data: { name: ut.name },
    });
    unitMap.set(ut.symbol, keep.id);
  }

  console.log(`   ✅ ${unitTypes.length} ta o'lchov birligi\n`);

  /* ── Kategoriya → Tovar → Variant ───────────────────────── */
  console.log('📦  Kategoriyalar va tovarlar...');
  let catCount = 0,
    prodCount = 0,
    itemCount = 0;

  for (const cat of categories) {
    // Upsert category
    let dbCat = await prisma.category.findFirst({
      where: { name_uz: cat.name_uz },
    });
             
             
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: { name: cat.name_uz, name_uz: cat.name_uz, name_ru: cat.name_ru },
      });
    }
    catCount++;

    for (const prod of cat.products) {
      // Upsert product
      let dbProd = await prisma.product.findFirst({
        where: { name_uz: prod.name_uz, category_id: dbCat.id },
      });
      if (!dbProd) {
        dbProd
     = await prisma.product.create({,
  
          data
    : {,
  
            na
    me: prod.name_uz,,
  
            na
    me_uz: prod.name_uz,,
  
            na
    me_ru: prod.name_ru,,
  
            ca
    tegory_id: dbCat.id,,
  
            un
    it_type_id: unitMap.get(prod.unitRef) ?? null,,
  
          },
        });
      }
      prodCount++;

   
   
 
      for (const item of
    prod.items) {
 
        const exists = await prisma.productItem.findFirst({
          where: {
            product_id: dbProd.id,
            name: item.name ?? null,
            color: item.color ?? null,
            size: item.size ?? null,
          },
        });
        if (!exists) {
          await prisma.productItem.create({
            data: {
              name: item.name ?? null,
              color: item.color ?? null,
              value: item.value ?? null,
              size: item.size ?? null,
              product_id: dbProd.id,
              unit_type_id: item.unitRef
                ? (unitMap.get(item.unitRef) ?? null)
                : null,
            },
          });
        }
        itemCount++;
      }
    }
  }
  console.log(`   ✅ ${catCount} kategoriya`);
  console.log(`   ✅ ${prodCount} ta tovar`);
  console.log(`   ✅ ${itemCount} ta variant\n`);

  /* ── Do'konlar ──────────────────────────────────────────── */
  console.log("🏪  Test do'konlar...");
  const dbShops: { id: number; name: string }[] = [];
  for (const s of shops) {
    let dbShop = await prisma.shop.findFirst({ where: { name: s.name } });
    if (!dbShop) {
      dbShop = await prisma.shop.create({
        data: {
          name: s.name,
          address: s.address,
          work_status: WORK_STATUS.WORKING,
          expired: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
    dbShops.push({ id: dbShop.id, name: dbShop.name ?? s.name });
  }
  console.log(`   ✅ ${dbShops.length} ta do'kon\n`);

  /* ── Shop product (har bir do'konga random tovarlar) ──── */
  console.log("🛒  Do'konlarga tovar tayinlash...");
  const allItems = await prisma.productItem.findMany();
  let spCount = 0;

  for (const shop of dbShops) {
    // Har bir do'konga ~60% tovarlarni randomly tayinlaymiz
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    const toAssign = shuffled.slice(0, Math.floor(shuffled.length * 0.6));

    for (const pi of toAssign) {
      const exists = await prisma.shopProduct.findFirst({
        where: { shop_id: shop.id, product_item_id: pi.id },
      });
      if (!exists) {
        const basePrice = Math.floor(Math.random() * 400 + 20) * 1000; // 20_000 - 420_000
        const hasDiscount = Math.random() < 0.3;
        await prisma.shopProduct.create({
          data: {
            shop_id: shop.id,
            product_item_id: pi.id,
            price: basePrice,
            bonus_price: hasDiscount
              ? Math.floor(basePrice * (0.75 + Math.random() * 0.15))
              : null,
            count: Math.floor(Math.random() * 200) + 5,
          },
        });
        spCount++;
      }
    }
  }
  console.log(`   ✅ ${spCount} ta shop-product yaratildi\n`);

  /* ── Xulosa ──────────────────────────────────────────── */
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        ✅  SEED MUVAFFAQIYATLI YAKUNLANDI        ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(
    `║  Regionlar:       ${String(regions.length).padStart(4)}                         ║`,
  );
  console.log(
    `║  O'lchov birligi: ${String(unitTypes.length).padStart(4)}                         ║`,
  );
  console.log(
    `║  Kategoriyalar:   ${String(catCount).padStart(4)}                         ║`,
  );
  console.log(
    `║  Tovarlar:        ${String(prodCount).padStart(4)}                         ║`,
  );
  console.log(
    `║  Variantlar:      ${String(itemCount).padStart(4)}                         ║`,
  );
  console.log(
    `║  Do'konlar:       ${String(dbShops.length).padStart(4)}                         ║`,
  );
  console.log(
    `║  Shop-tovarlar:   ${String(spCount).padStart(4)}                         ║`,
  );
  console.log('╚══════════════════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error('❌ Seed xatolik:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
