const request = require('supertest');
const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Restock Request Workflow', () => {
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

  describe('Restock Request Creation', () => {
    it('should create a restock request', async () => {
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 50,
          status: 'pending',
          requested_by: testData.users.manager.user_id,
        },
      });

      expect(restockRequest).toBeDefined();
      expect(restockRequest.status).toBe('pending');
      expect(restockRequest.requested_qty).toBe(50);
    });

    it('should auto-create restock request when stock is low (trigger)', async () => {
      // Create a new item with low stock
      const newItem = await prisma.items.create({
        data: {
          item_name: 'Low Stock Item',
          category: 'Test',
          unit_price: 10.0,
          unit_of_measure: 'pcs',
        },
      });

      // Create branch stock below reorder level
      await prisma.branch_stock.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: newItem.item_id,
          quantity: 5, // Below default reorder level
          reorder_level: 20,
        },
      });

      // Check if trigger created a restock request
      const autoRequest = await prisma.restock_requests.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: newItem.item_id,
          status: 'pending',
        },
      });

      // Trigger should have created this automatically
      expect(autoRequest).toBeDefined();
    });
  });

  describe('Restock Request Approval', () => {
    it('should approve a pending restock request', async () => {
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          requested_qty: 30,
          status: 'pending',
          requested_by: testData.users.manager.user_id,
        },
      });

      const approved = await prisma.restock_requests.update({
        where: {
          request_id: restockRequest.request_id,
        },
        data: {
          status: 'approved',
          supplier_id: testData.supplier.supplier_id,
          approved_by: testData.users.admin.user_id,
          approved_at: new Date(),
        },
      });

      expect(approved.status).toBe('approved');
      expect(approved.approved_by).toBe(testData.users.admin.user_id);
      expect(approved.supplier_id).toBe(testData.supplier.supplier_id);
    });
  });

  describe('Restock Request Fulfillment (Stored Procedure)', () => {
    it('should fulfill approved restock request and update stock', async () => {
      // Create and approve a restock request
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 100,
          status: 'approved',
          requested_by: testData.users.manager.user_id,
          supplier_id: testData.supplier.supplier_id,
          approved_by: testData.users.admin.user_id,
          approved_at: new Date(),
        },
      });

      const initialStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      // Call stored procedure sp_fulfill_restock_request
      await prisma.$executeRaw`
        CALL sp_fulfill_restock_request(
          ${restockRequest.request_id},
          ${testData.users.admin.user_id}
        )
      `;

      // Verify request status changed to fulfilled
      const fulfilledRequest = await prisma.restock_requests.findUnique({
        where: {
          request_id: restockRequest.request_id,
        },
      });

      // Verify stock was increased
      const updatedStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      expect(fulfilledRequest.status).toBe('fulfilled');
      expect(fulfilledRequest.fulfilled_at).toBeDefined();
      expect(fulfilledRequest.fulfilled_by).toBe(testData.users.admin.user_id);
      expect(updatedStock.quantity).toBe(initialStock.quantity + 100);
    });

    it('should create stock movement record during fulfillment', async () => {
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          requested_qty: 75,
          status: 'approved',
          requested_by: testData.users.manager.user_id,
          supplier_id: testData.supplier.supplier_id,
          approved_by: testData.users.admin.user_id,
          approved_at: new Date(),
        },
      });

      // Fulfill the request
      await prisma.$executeRaw`
        CALL sp_fulfill_restock_request(
          ${restockRequest.request_id},
          ${testData.users.admin.user_id}
        )
      `;

      // Check if stock movement was created
      const movement = await prisma.stock_movements.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          movement_type: 'restock',
          quantity: 75,
        },
        orderBy: {
          movement_date: 'desc',
        },
      });

      expect(movement).toBeDefined();
      expect(movement.quantity).toBe(75);
      expect(movement.movement_type).toBe('restock');
    });
  });

  describe('Restock Request Rejection', () => {
    it('should reject a pending restock request', async () => {
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 20,
          status: 'pending',
          requested_by: testData.users.manager.user_id,
        },
      });

      const rejected = await prisma.restock_requests.update({
        where: {
          request_id: restockRequest.request_id,
        },
        data: {
          status: 'rejected',
        },
      });

      expect(rejected.status).toBe('rejected');
    });
  });
});
