const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check the actual CHECK constraint on stock_movements
  const result = await prisma.$queryRaw`
    SELECT conname, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'stock_movements'::regclass
      AND contype = 'c'
  `;
  console.log('CHECK constraints on stock_movements:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
