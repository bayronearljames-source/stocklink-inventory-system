const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the actual source of the stored procedure in the DB
  const result = await prisma.$queryRaw`
    SELECT prosrc, pronargs, proargnames, proargtypes::text
    FROM pg_proc
    WHERE proname = 'sp_fulfill_restock_request'
  `;
  console.log('Live stored procedure definition:');
  result.forEach((r, i) => {
    console.log(`\n--- Overload ${i + 1} (${r.pronargs} args: ${r.proargnames}) ---`);
    console.log(r.prosrc);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
