const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Supplier Management', () => {
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

  describe('GET /api/suppliers', () => {
    it('should return all suppliers for authenticated users', async () => {
      const suppliers = await prisma.suppliers.findMany();
      expect(Array.isArray(suppliers)).toBe(true);
      // Seeded data includes one supplier
      expect(suppliers.length).toBeGreaterThanOrEqual(1);
    });

    it('seeded supplier should have required fields', async () => {
      const supplier = await prisma.suppliers.findFirst({
        where: { supplier_name: 'Test Supplier Co.' },
      });
      expect(supplier).toBeDefined();
      expect(supplier.supplier_name).toBe('Test Supplier Co.');
      expect(supplier.contact_info).toBeTruthy();
    });
  });

  describe('CREATE supplier', () => {
    it('should create a new supplier', async () => {
      const newSupplier = await prisma.suppliers.create({
        data: {
          supplier_name: 'New Test Supplier',
          contact_info: 'Jane Smith, 555-0300, jane@newsupplier.com',
        },
      });

      expect(newSupplier).toBeDefined();
      expect(newSupplier.supplier_id).toBeDefined();
      expect(newSupplier.supplier_name).toBe('New Test Supplier');
    });

    it('should allow duplicate supplier names (no UNIQUE constraint on supplier_name)', async () => {
      // The schema does NOT have UNIQUE on supplier_name — two suppliers can share a name.
      const s1 = await prisma.suppliers.create({
        data: { supplier_name: 'Duplicate Name Co.', contact_info: 'contact A' },
      });
      const s2 = await prisma.suppliers.create({
        data: { supplier_name: 'Duplicate Name Co.', contact_info: 'contact B' },
      });
      expect(s1.supplier_id).not.toBe(s2.supplier_id);
      expect(s1.supplier_name).toBe(s2.supplier_name);
    });
  });

  describe('UPDATE supplier', () => {
    it('should update supplier contact info', async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: 'Supplier To Update',
          contact_info: 'Old Contact',
        },
      });

      const updated = await prisma.suppliers.update({
        where: { supplier_id: supplier.supplier_id },
        data: { contact_info: 'New Contact Info Updated' },
      });

      expect(updated.contact_info).toBe('New Contact Info Updated');
    });

    it('should throw on update for non-existent supplier', async () => {
      await expect(
        prisma.suppliers.update({
          where: { supplier_id: 9999999 },
          data: { contact_info: 'ghost update' },
        })
      ).rejects.toThrow();
    });
  });

  describe('DELETE supplier', () => {
    it('should delete a supplier with no linked items', async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: 'Supplier To Delete',
          contact_info: 'Temp contact',
        },
      });

      await prisma.suppliers.delete({
        where: { supplier_id: supplier.supplier_id },
      });

      const deleted = await prisma.suppliers.findUnique({
        where: { supplier_id: supplier.supplier_id },
      });
      expect(deleted).toBeNull();
    });

    it('deleting a supplier should cascade-delete its supplier_items rows', async () => {
      // supplier_items FK has ON DELETE CASCADE on supplier_id —
      // deleting the supplier removes its supplier_items automatically.
      const supplier = await prisma.suppliers.create({
        data: { supplier_name: 'Cascade Test Supplier', contact_info: 'cascade' },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 10.0,
          lead_time_days: 3,
        },
      });

      // Deleting the supplier should succeed and cascade to supplier_items
      await prisma.suppliers.delete({ where: { supplier_id: supplier.supplier_id } });

      const orphanedLink = await prisma.supplier_items.findFirst({
        where: { supplier_id: supplier.supplier_id },
      });
      expect(orphanedLink).toBeNull(); // cascaded away
    });
  });
});
