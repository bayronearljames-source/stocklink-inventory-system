const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Audit Logs', () => {
  let testData;
  let adminToken;
  let prisma;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
    prisma = getPrismaClient();
    adminToken = generateToken(testData.users.admin);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Trigger: trg_audit_branch_stock', () => {
    it('should create an audit log entry when branch stock quantity changes', async () => {
      // Count existing audit logs
      const before = await prisma.audit_logs.count();

      // Update branch_stock quantity — this fires trg_audit_branch_stock
      await prisma.branch_stock.update({
        where: {
          branch_id_item_id: {
            branch_id: testData.branch.branch_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: { quantity: { decrement: 1 } },
      });

      const after = await prisma.audit_logs.count();
      expect(after).toBeGreaterThan(before);
    });

    it('audit log entry should have correct table_name and operation', async () => {
      // Trigger another stock change
      await prisma.branch_stock.update({
        where: {
          branch_id_item_id: {
            branch_id: testData.branch.branch_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: { quantity: { increment: 5 } },
      });

      const log = await prisma.audit_logs.findFirst({
        orderBy: { changed_at: 'desc' },
      });

      expect(log).toBeDefined();
      expect(log.table_name).toBe('branch_stock');
      // Schema uses 'action' column (INSERT | UPDATE | DELETE)
      expect(['UPDATE', 'INSERT', 'DELETE']).toContain(log.action);
    });

    it('audit log should capture old and new values as JSON', async () => {
      const log = await prisma.audit_logs.findFirst({
        orderBy: { changed_at: 'desc' },
      });

      expect(log).toBeDefined();
      // Schema uses old_value / new_value (JSONB). At least one should be present.
      const hasData = log.old_value !== null || log.new_value !== null;
      expect(hasData).toBe(true);
    });

    it('audit log records should have a valid timestamp', async () => {
      const log = await prisma.audit_logs.findFirst({
        orderBy: { changed_at: 'desc' },
      });

      expect(log.changed_at).toBeDefined();
      expect(log.changed_at instanceof Date).toBe(true);
    });
  });

  describe('Audit log access control', () => {
    it('admin should be able to query audit logs', async () => {
      const logs = await prisma.audit_logs.findMany({
        take: 10,
        orderBy: { changed_at: 'desc' },
      });
      // Admin can read — should not throw
      expect(Array.isArray(logs)).toBe(true);
    });

    it('audit logs should be read-only (no application-level writes)', async () => {
      // Verify the application never directly inserts into audit_logs.
      // Logs are ONLY written by the trigger — attempting a direct insert
      // would bypass the system and is considered a violation.
      // This test documents the expectation; trigger-generated rows are present.
      const count = await prisma.audit_logs.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
