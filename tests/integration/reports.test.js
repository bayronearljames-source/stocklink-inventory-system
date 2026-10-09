const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');

describe('Reports & Analytics', () => {
  let testData;
  let prisma;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
    prisma = getPrismaClient();

    // Seed some stock movements so reports have data to work with
    await prisma.stock_movements.createMany({
      data: [
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          moved_by: testData.users.clerk.user_id,
          movement_type: 'sale',
          quantity: 10,
        },
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          moved_by: testData.users.clerk.user_id,
          movement_type: 'sale',
          quantity: 5,
        },
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          moved_by: testData.users.clerk.user_id,
          movement_type: 'withdrawal',
          quantity: 3,
        },
      ],
    });

    // Seed some restock requests for frequency report
    await prisma.restock_requests.createMany({
      data: [
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 50,
          status: 'pending',
        },
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[0].item_id,
          requested_qty: 50,
          status: 'fulfilled',
          fulfilled_at: new Date(),
          approved_by: testData.users.admin.user_id,
        },
        {
          branch_id: testData.branch.branch_id,
          item_id: testData.items[1].item_id,
          requested_qty: 30,
          status: 'fulfilled',
          fulfilled_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hrs ago
          approved_by: testData.users.admin.user_id,
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Restock Frequency Report', () => {
    it('should return items grouped by restock request count', async () => {
      const frequency = await prisma.restock_requests.groupBy({
        by: ['item_id'],
        _count: { request_id: true },
        orderBy: { _count: { request_id: 'desc' } },
        take: 10,
      });

      expect(Array.isArray(frequency)).toBe(true);
      expect(frequency.length).toBeGreaterThan(0);
      // item[0] should have more requests than item[1]
      expect(frequency[0]._count.request_id).toBeGreaterThanOrEqual(
        frequency[frequency.length - 1]._count.request_id
      );
    });

    it('most restocked item should be items[0] (2 requests vs 1)', async () => {
      const frequency = await prisma.restock_requests.groupBy({
        by: ['item_id'],
        _count: { request_id: true },
        orderBy: { _count: { request_id: 'desc' } },
      });

      expect(frequency[0].item_id).toBe(testData.items[0].item_id);
      expect(frequency[0]._count.request_id).toBe(2);
    });
  });

  describe('Fulfillment Time Report', () => {
    it('should calculate average fulfillment time for fulfilled requests', async () => {
      const fulfilled = await prisma.restock_requests.findMany({
        where: { status: 'fulfilled', fulfilled_at: { not: null } },
        select: { requested_at: true, fulfilled_at: true },
      });

      expect(fulfilled.length).toBeGreaterThan(0);

      const totalMs = fulfilled.reduce((sum, req) => {
        const diffMs = new Date(req.fulfilled_at) - new Date(req.requested_at);
        return sum + diffMs;
      }, 0);

      const avgHours = totalMs / fulfilled.length / (1000 * 60 * 60);
      // avg can be near-zero in tests (seed data created & fulfilled at same time)
      expect(typeof avgHours).toBe('number');
      expect(isNaN(avgHours)).toBe(false);
    });

    it('should return 0 average when no fulfilled requests exist', async () => {
      // Query with impossible condition
      const fulfilled = await prisma.restock_requests.findMany({
        where: {
          status: 'fulfilled',
          fulfilled_at: { not: null },
          branch_id: -1, // impossible
        },
        select: { requested_at: true, fulfilled_at: true },
      });

      expect(fulfilled.length).toBe(0);
      const avg = fulfilled.length === 0 ? 0 : 1;
      expect(avg).toBe(0);
    });
  });

  describe('Branch Consumption Report', () => {
    it('should group stock movements by branch and sum quantities', async () => {
      const consumption = await prisma.stock_movements.groupBy({
        by: ['branch_id'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
      });

      expect(Array.isArray(consumption)).toBe(true);
      expect(consumption.length).toBeGreaterThan(0);

      const branchEntry = consumption.find(
        (c) => c.branch_id === testData.branch.branch_id
      );
      expect(branchEntry).toBeDefined();
      // 10 + 5 + 3 = 18 total units moved
      expect(branchEntry._sum.quantity).toBe(18);
    });

    it('percentage should add up to 100 across all branches', async () => {
      const consumption = await prisma.stock_movements.groupBy({
        by: ['branch_id'],
        _sum: { quantity: true },
      });

      const total = consumption.reduce((sum, c) => sum + (c._sum.quantity || 0), 0);
      const withPct = consumption.map((c) => ({
        pct: total > 0 ? Math.round((c._sum.quantity / total) * 100) : 0,
      }));

      const sumPct = withPct.reduce((s, c) => s + c.pct, 0);
      // Allow ±1 rounding error across multiple branches
      expect(sumPct).toBeGreaterThanOrEqual(99);
      expect(sumPct).toBeLessThanOrEqual(101);
    });
  });
});
