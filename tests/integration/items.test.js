const request = require('supertest');
const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Items CRUD Operations', () => {
  let testData;
  let adminToken;
  let managerToken;
  let clerkToken;
  let prisma;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
    prisma = getPrismaClient();

    adminToken = generateToken(testData.users.admin);
    managerToken = generateToken(testData.users.manager);
    clerkToken = generateToken(testData.users.clerk);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Create Item', () => {
    it('should create a new item', async () => {
      const newItem = await prisma.items.create({
        data: {
          item_name: 'New Test Item',
          category: 'Furniture',
          unit_price: 299.99,
          unit_of_measure: 'pcs',
        },
      });

      expect(newItem).toBeDefined();
      expect(newItem.item_name).toBe('New Test Item');
      expect(parseFloat(newItem.unit_price)).toBe(299.99); // Decimal returns as string
      expect(newItem.category).toBe('Furniture');
    });

    it('should require all mandatory fields', async () => {
      await expect(
        prisma.items.create({
          data: {
            item_name: 'Incomplete Item',
            // Missing required fields
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Items', () => {
    it('should retrieve all items', async () => {
      const items = await prisma.items.findMany();

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should retrieve item by ID', async () => {
      const item = await prisma.items.findUnique({
        where: {
          item_id: testData.items[0].item_id,
        },
      });

      expect(item).toBeDefined();
      expect(item.item_id).toBe(testData.items[0].item_id);
    });

    it('should filter items by category', async () => {
      const electronicsItems = await prisma.items.findMany({
        where: {
          category: 'Electronics',
        },
      });

      expect(electronicsItems.every(item => item.category === 'Electronics')).toBe(true);
    });
  });

  describe('Update Item', () => {
    it('should update item details', async () => {
      const updated = await prisma.items.update({
        where: {
          item_id: testData.items[0].item_id,
        },
        data: {
          unit_price: 129.99,
          category: 'Updated Category',
        },
      });

      expect(parseFloat(updated.unit_price)).toBe(129.99); // Decimal returns as string
      expect(updated.category).toBe('Updated Category');
      expect(updated.item_name).toBe(testData.items[0].item_name); // Unchanged
    });

    it('should return error for non-existent item', async () => {
      await expect(
        prisma.items.update({
          where: {
            item_id: 99999,
          },
          data: {
            unit_price: 100,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Item', () => {
    it('should delete item with no dependencies', async () => {
      const itemToDelete = await prisma.items.create({
        data: {
          item_name: 'Delete Me',
          category: 'Test',
          unit_price: 1.0,
          unit_of_measure: 'pcs',
        },
      });

      await prisma.items.delete({
        where: {
          item_id: itemToDelete.item_id,
        },
      });

      const deleted = await prisma.items.findUnique({
        where: {
          item_id: itemToDelete.item_id,
        },
      });

      expect(deleted).toBeNull();
    });

    it('should prevent deletion of item with branch stock', async () => {
      // testData.items[0] has branch_stock associated
      await expect(
        prisma.items.delete({
          where: {
            item_id: testData.items[0].item_id,
          },
        })
      ).rejects.toThrow(); // Foreign key constraint violation
    });
  });

  describe('Item Validation', () => {
    it('should enforce positive unit price', async () => {
      await expect(
        prisma.items.create({
          data: {
            item_name: 'Negative Price Item',
            category: 'Test',
            unit_price: -10.0,
            unit_of_measure: 'pcs',
          },
        })
      ).rejects.toThrow(); // Check constraint should prevent this
    });

    it('should handle decimal prices correctly', async () => {
      const item = await prisma.items.create({
        data: {
          item_name: 'Decimal Price Item',
          category: 'Test',
          unit_price: 19.99,
          unit_of_measure: 'pcs',
        },
      });

      expect(parseFloat(item.unit_price)).toBe(19.99); // Decimal returns as string
    });
  });
});
