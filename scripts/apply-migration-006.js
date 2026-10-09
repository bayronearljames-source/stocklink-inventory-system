// Applies migration 006 — fixes sp_fulfill_restock_request to use movement_type='adjustment'
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(
    path.resolve(__dirname, '../migrations/006_fix_sp_movement_type.sql'),
    'utf8'
  );
  await prisma.$executeRawUnsafe(sql);
  console.log('✅  Migration 006 applied — sp_fulfill_restock_request fixed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
