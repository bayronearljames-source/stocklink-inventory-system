const path = require('path');
const dotenv = require('dotenv');

// Tests call cleanDatabase(), which deletes application rows. Require a dedicated
// test environment so a missing .env.test cannot fall back to the root .env.
const testEnvPath = path.resolve(__dirname, '../../.env.test');
const testEnv = dotenv.config({ path: testEnvPath, override: true });
if (testEnv.error) {
  throw new Error('Missing .env.test. Create it with a disposable test database before running tests.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('.env.test must define DATABASE_URL for the disposable test database.');
}

const { PrismaClient } = require('@prisma/client');

let prisma;

/**
 * Initialize Prisma client for testing
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Clean up database before tests
 * Deletes all records in the correct order to respect foreign key constraints
 */
async function cleanDatabase() {
  const prisma = getPrismaClient();

  // Delete in reverse dependency order (children first, parents last)
  await prisma.stock_movements.deleteMany({});
  await prisma.audit_logs.deleteMany({});
  await prisma.restock_requests.deleteMany({});
  await prisma.branch_stock.deleteMany({});
  await prisma.central_stock.deleteMany({});
  await prisma.supplier_items.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.branches.deleteMany({});
  await prisma.central_warehouse.deleteMany({});
  await prisma.suppliers.deleteMany({});
  await prisma.items.deleteMany({});
}

/**
 * Seed test data
 */
async function seedTestData() {
  const prisma = getPrismaClient();
  const bcrypt = require('bcrypt');

  // Create test items
  const item1 = await prisma.items.create({
    data: {
      item_name: 'Test Widget A',
      category: 'Electronics',
      unit_price: 99.99,
      unit_of_measure: 'pcs',
    },
  });

  const item2 = await prisma.items.create({
    data: {
      item_name: 'Test Widget B',
      category: 'Hardware',
      unit_price: 49.99,
      unit_of_measure: 'pcs',
    },
  });

  // Create test branch
  const branch = await prisma.branches.create({
    data: {
      branch_name: 'Test Branch',
      location: '123 Test St',
      contact_phone: '555-0100',
    },
  });

  // Create test supplier
  const supplier = await prisma.suppliers.create({
    data: {
      supplier_name: 'Test Supplier Co.',
      contact_info: 'John Tester, 555-0200, test@supplier.com',
    },
  });

  // Create test users with different roles
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.users.create({
    data: {
      username: 'testadmin',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });

  const managerUser = await prisma.users.create({
    data: {
      username: 'testmanager',
      password_hash: hashedPassword,
      role: 'branch_manager',
      branch_id: branch.branch_id,
    },
  });

  const clerkUser = await prisma.users.create({
    data: {
      username: 'testclerk',
      password_hash: hashedPassword,
      role: 'clerk',
      branch_id: branch.branch_id,
    },
  });

  // Create central warehouse
  const warehouse = await prisma.central_warehouse.create({
    data: {
      warehouse_name: 'Central Test Warehouse',
      location: '999 Warehouse Ave',
    },
  });

  // Create central stock for fulfillment tests
  await prisma.central_stock.create({
    data: {
      warehouse_id: warehouse.warehouse_id,
      item_id: item1.item_id,
      quantity: 1000, // Enough for restock fulfillment tests
    },
  });

  await prisma.central_stock.create({
    data: {
      warehouse_id: warehouse.warehouse_id,
      item_id: item2.item_id,
      quantity: 1000,
    },
  });

  // Create branch stock
  await prisma.branch_stock.create({
    data: {
      branch_id: branch.branch_id,
      item_id: item1.item_id,
      quantity: 100,
      reorder_threshold: 20,
    },
  });

  return {
    items: [item1, item2],
    branch,
    supplier,
    warehouse,
    users: { admin: adminUser, manager: managerUser, clerk: clerkUser },
  };
}

/**
 * Close database connection
 */
async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrismaClient,
  cleanDatabase,
  seedTestData,
  disconnectDatabase,
};
