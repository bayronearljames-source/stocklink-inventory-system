const request = require('supertest');
const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Stock Movement Flow', () => {
  let testData;
  let adminToken;
  let managerToken;
  let prisma;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
    prisma = getPrismaClient();

    adminToken = generateToken(testData.users.admin);
    managerToken = generateToken(testData.users.manager);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Stock Movement Creation', () => {
    it('should record a sale movement and reduce stock', async () => {
      const initialStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      const movement = await prisma.stock_movements.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          movement_type: 'sale',
          quantity: 10,
          unit_price: testData.items[0].unit_price,
          performed_by: testData.users.clerk.user_id,
        },
      });

      // Update the branch stock
      await prisma.branch_stock.update({
        where: {
          branch_id_item_id: {
            branch_id: testData.branch.branch_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: {
          quantity: initialStock.quantity - 10,
        },
      });

      const updatedStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      expect(movement.movement_type).toBe('sale');
      expect(movement.quantity).toBe(10);
      expect(updatedStock.quantity).toBe(initialStock.quantity - 10);
    });

    it('should record a withdrawal movement', async () => {
      const movement = await prisma.stock_movements.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          movement_type: 'withdrawal',
          quantity: 5,
          unit_price: testData.items[0].unit_price,
          performed_by: testData.users.manager.user_id,
          notes: 'Damaged goods removal',
        },
      });

      expect(movement.movement_type).toBe('withdrawal');
      expect(movement.notes).toBe('Damaged goods removal');
    });

    it('should record an adjustment movement', async () => {
      const movement = await prisma.stock_movements.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          movement_type: 'adjustment',
          quantity: -3, // Correction
          unit_price: testData.items[0].unit_price,
          performed_by: testData.users.admin.user_id,
          notes: 'Inventory count correction',
        },
      });

      expect(movement.movement_type).toBe('adjustment');
      expect(movement.quantity).toBe(-3);
    });
  });

  describe('Audit Log Trigger', () => {
    it('should create audit log when stock is updated', async () => {
      const stockBefore = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      const oldQuantity = stockBefore.quantity;

      // Update stock
      await prisma.branch_stock.update({
        where: {
          branch_id_item_id: {
            branch_id: testData.branch.branch_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: {
          quantity: oldQuantity + 50,
        },
      });

      // Check if audit log was created by trigger
      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          table_name: 'branch_stock',
          // record_id would be the composite key, but audit logs may not have this
        },
        },
        orderBy: {
          changed_at: 'desc',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog.action).toMatch(/UPDATE|INSERT/);
      expect(auditLog.old_values).toBeDefined();
      expect(auditLog.new_values).toBeDefined();
    });
  });

  describe('Low Stock Detection', () => {
    it('should detect when stock falls below reorder threshold', async () => {
      const stock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      // Set quantity below reorder threshold
      const newQuantity = stock.reorder_threshold - 5;

      await prisma.branch_stock.update({
        where: {
          branch_id_item_id: {
            branch_id: testData.branch.branch_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: {
          quantity: newQuantity,
        },
      });

      const updatedStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      expect(updatedStock.quantity).toBeLessThan(updatedStock.reorder_threshold);
    });
  });
});
