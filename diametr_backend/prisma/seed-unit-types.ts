import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const unitTypes = [
  {
    name: 'Dona',
    name_uz: 'Dona',
    name_ru: 'Штука',
    symbol: 'dona',
  },
  {
    name: 'Kilogramm',
    name_uz: 'Kilogramm',
    name_ru: 'Килограмм',
    symbol: 'kg',
  },
  {
    name: 'Tonna',
    name_uz: 'Tonna',
    name_ru: 'Тонна',
    symbol: 't',
  },
  {
    name: 'Litr',
    name_uz: 'Litr',
    name_ru: 'Литр',
    symbol: 'L',
  },
  {
    name: 'Metr',
    name_uz: 'Metr',
    name_ru: 'Метр',
    symbol: 'm',
  },
  {
    name: 'Kvadrat metr',
    name_uz: 'Kvadrat metr',
    name_ru: 'Квадратный метр',
    symbol: 'm²',
  },
  {
    name: "O'lcham (x*y)",
    name_uz: "O'lcham (x*y)",
    name_ru: 'Размер (x*y)',
    symbol: 'x*y',
  },
  {
    name: "O'lcham (x*y*z)",
    name_uz: "O'lcham (x*y*z)",
    name_ru: 'Размер (x*y*z)',
    symbol: 'x*y*z',
  },
];

const expectedSymbols = new Set(unitTypes.map((unit) => unit.symbol));

async function main() {
  console.log('Seeding unit types...');

  const existingUnits = await prisma.unitType.findMany({
    orderBy: {
      id: 'asc',
    },
  });

  const unexpectedIds = existingUnits
    .filter((unit) => !expectedSymbols.has(unit.symbol))
    .map((unit) => unit.id);

  if (unexpectedIds.length > 0) {
    console.log(
      `  Found ${unexpectedIds.length} unexpected unit type(s). Clearing references and deleting them...`
    );
    await prisma.product.updateMany({
      where: {
        unit_type_id: {
          in: unexpectedIds,
        },
      },
      data: {
        unit_type_id: null,
      },
    });
    await prisma.productItem.updateMany({
      where: { unit_type_id: { in: unexpectedIds } },
      data: { unit_type_id: null },
    });
    await prisma.unitType.deleteMany({ where: { id: { in: unexpectedIds } } });
  }

  const unitMap = new Map<string, number>();

  for (const entry of unitTypes) {
    const duplicates = await prisma.unitType.findMany({
      where: { symbol: entry.symbol },
      orderBy: { id: 'asc' },
    });

    if (duplicates.length === 0) {
      const created = await prisma.unitType.create({ data: entry });
      unitMap.set(entry.symbol, created.id);
      console.log(`  Created unit type '${entry.symbol}' (id=${created.id})`);
      continue;
    }

    const [keep, ...remove] = duplicates;
    if (remove.length > 0) {
      const removeIds = remove.map((unit) => unit.id);
      await prisma.product.updateMany({
        where: {
          unit_type_id: {
            in: removeIds,
          },
        },
        data: {
          unit_type_id: null,
        },
      });
      await prisma.productItem.updateMany({
        where: {
          unit_type_id: {
            in: removeIds,
          },
        },
        data: {
          unit_type_id: null,
        },
      });
      await prisma.unitType.deleteMany({
        where: {
          id: {
            in: removeIds,
          },
        },
      });
      console.log(
        `  Removed duplicate unit type IDs ${removeIds.join(', ')} for symbol '${entry.symbol}'`
      );
    }

    await prisma.unitType.update({
      where: { id: keep.id },
      data: {
        name: entry.name,
        name_uz: entry.name_uz,
        name_ru: entry.name_ru,
      },
    });
    unitMap.set(entry.symbol, keep.id);
    console.log(`  Kept/updated unit type '${entry.symbol}' (id=${keep.id})`);
  }

  console.log(`  Dona unit type id = ${unitMap.get('dona')}`);
  console.log('✅ Unit type seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
