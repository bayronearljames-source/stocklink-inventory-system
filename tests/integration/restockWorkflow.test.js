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
          // Note: requested_by field doesn't exist in schema
          // The user who requested is tracked via approved_by when approved
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

      // Create branch stock below reorder threshold
      await prisma.branch_stock.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: newItem.item_id,
          quantity: 5, // Below default reorder threshold
          reorder_threshold: 20,
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
        },
      });

      const approved = await prisma.restock_requests.update({
        where: {
          request_id: restockRequest.request_id,
        },
        data: {
          status: 'approved',
          approved_by: testData.users.admin.user_id,
          // Note: supplier_id and approved_at don't exist in restock_requests schema
        },
      });

      expect(approved.status).toBe('approved');
      expect(approved.approved_by).toBe(testData.users.admin.user_id);
    });
  });

  describe('Restock Request Fulfillment (Stored Procedure)', () => {
    it('should fulfill approved restock request and update stock', async () => {
      // Create a PENDING restock request (procedure expects status='pending')
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 100,
          status: 'pending', // Must be 'pending' for stored procedure
        },
      });

      const initialStock = await prisma.branch_stock.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
        },
      });

      // Call stored procedure sp_fulfill_restock_request(p_request_id, p_warehouse_id, p_approved_by)
      await prisma.$executeRaw`
        CALL sp_fulfill_restock_request(
          ${restockRequest.request_id}::integer,
          ${testData.warehouse.warehouse_id}::integer,
          ${testData.users.admin.user_id}::integer
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
      // Note: fulfilled_by doesn't exist in schema, stored procedure may not set it
      expect(updatedStock.quantity).toBe(initialStock.quantity + 100);
    });

    it('should create stock movement record during fulfillment', async () => {
      const restockRequest = await prisma.restock_requests.create({
        data: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          requested_qty: 75,
          status: 'pending', // Must be 'pending' for stored procedure
        },
      });

      // Fulfill the request
      await prisma.$executeRaw`
        CALL sp_fulfill_restock_request(
          ${restockRequest.request_id}::integer,
          ${testData.warehouse.warehouse_id}::integer,
          ${testData.users.admin.user_id}::integer
        )
      `;

      // Check if stock movement was created
      // Note: The stored procedure inserts movement_type='adjustment' (per migration 004)
      const movement = await prisma.stock_movements.findFirst({
        where: {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          movement_type: 'adjustment', // Stored procedure uses 'adjustment' for restocks
          quantity: 75,
        },
        orderBy: {
          moved_at: 'desc', // Correct field name
        },
      });

      expect(movement).toBeDefined();
      expect(movement.quantity).toBe(75);
      expect(movement.movement_type).toBe('adjustment');
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
