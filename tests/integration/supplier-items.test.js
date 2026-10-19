const {
  cleanDatabase,
  seedTestData,
  disconnectDatabase,
  getPrismaClient,
} = require("../helpers/testSetup");
const { generateToken } = require("../helpers/authHelper");

describe("Supplier-Item Linking", () => {
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

  describe("GET /api/suppliers/:id/items", () => {
    it("should return all items linked to a supplier", async () => {
      // Create a supplier-item link
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Test Supplier for Items",
          contact_info: "test@supplier.com",
        },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 100.0,
          lead_time_days: 5,
          min_order_qty: 10,
        },
      });

      const items = await prisma.supplier_items.findMany({
        where: { supplier_id: supplier.supplier_id },
        include: { items: true, suppliers: true },
      });

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(1);
      expect(items[0].unit_cost).toBe(100.0);
      expect(items[0].lead_time_days).toBe(5);
    });

    it("should return empty array for supplier with no items", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Empty Supplier",
          contact_info: "empty@supplier.com",
        },
      });

      const items = await prisma.supplier_items.findMany({
        where: { supplier_id: supplier.supplier_id },
      });

      expect(items.length).toBe(0);
    });
  });

  describe("GET /api/items/:id/suppliers", () => {
    it("should return all suppliers for a specific item", async () => {
      const supplier1 = await prisma.suppliers.create({
        data: {
          supplier_name: "Supplier A",
          contact_info: "a@supplier.com",
        },
      });

      const supplier2 = await prisma.suppliers.create({
        data: {
          supplier_name: "Supplier B",
          contact_info: "b@supplier.com",
        },
      });

      await prisma.supplier_items.createMany({
        data: [
          {
            supplier_id: supplier1.supplier_id,
            item_id: testData.items[0].item_id,
            unit_cost: 90.0,
            lead_time_days: 3,
            min_order_qty: 5,
          },
          {
            supplier_id: supplier2.supplier_id,
            item_id: testData.items[0].item_id,
            unit_cost: 95.0,
            lead_time_days: 7,
            min_order_qty: 10,
          },
        ],
      });

      const suppliers = await prisma.supplier_items.findMany({
        where: { item_id: testData.items[0].item_id },
        include: { suppliers: true },
      });

      expect(suppliers.length).toBe(2);
    });
  });

  describe("POST /api/supplier-items", () => {
    it("should create a new supplier-item link", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "New Link Supplier",
          contact_info: "link@supplier.com",
        },
      });

      const link = await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 125.5,
          lead_time_days: 10,
          min_order_qty: 20,
        },
      });

      expect(link).toBeDefined();
      expect(link.supplier_id).toBe(supplier.supplier_id);
      expect(link.item_id).toBe(testData.items[0].item_id);
      expect(Number(link.unit_cost)).toBe(125.5);
      expect(link.lead_time_days).toBe(10);
      expect(link.min_order_qty).toBe(20);
    });

    it("should fail when creating duplicate supplier-item link", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Duplicate Test Supplier",
          contact_info: "dup@supplier.com",
        },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 100.0,
          lead_time_days: 5,
          min_order_qty: 1,
        },
      });

      // Attempting to create the same link should throw
      await expect(
        prisma.supplier_items.create({
          data: {
            supplier_id: supplier.supplier_id,
            item_id: testData.items[0].item_id,
            unit_cost: 110.0,
            lead_time_days: 6,
            min_order_qty: 1,
          },
        })
      ).rejects.toThrow();
    });

    it("should use default min_order_qty of 1 when not provided", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Default MOQ Supplier",
          contact_info: "moq@supplier.com",
        },
      });

      const link = await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 50.0,
          lead_time_days: 2,
          // min_order_qty will default to 1
        },
      });

      expect(link.min_order_qty).toBe(1);
    });
  });

  describe("PUT /api/supplier-items/:supplier_id/:item_id", () => {
    it("should update supplier-item pricing", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Update Test Supplier",
          contact_info: "update@supplier.com",
        },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 100.0,
          lead_time_days: 5,
          min_order_qty: 10,
        },
      });

      const updated = await prisma.supplier_items.update({
        where: {
          supplier_id_item_id: {
            supplier_id: supplier.supplier_id,
            item_id: testData.items[0].item_id,
          },
        },
        data: {
          unit_cost: 95.0,
          lead_time_days: 3,
          min_order_qty: 15,
        },
      });

      expect(Number(updated.unit_cost)).toBe(95.0);
      expect(updated.lead_time_days).toBe(3);
      expect(updated.min_order_qty).toBe(15);
    });

    it("should fail when updating non-existent link", async () => {
      await expect(
        prisma.supplier_items.update({
          where: {
            supplier_id_item_id: {
              supplier_id: 99999,
              item_id: 99999,
            },
          },
          data: { unit_cost: 100.0 },
        })
      ).rejects.toThrow();
    });
  });

  describe("DELETE /api/supplier-items/:supplier_id/:item_id", () => {
    it("should delete a supplier-item link", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Delete Test Supplier",
          contact_info: "delete@supplier.com",
        },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 100.0,
          lead_time_days: 5,
          min_order_qty: 10,
        },
      });

      await prisma.supplier_items.delete({
        where: {
          supplier_id_item_id: {
            supplier_id: supplier.supplier_id,
            item_id: testData.items[0].item_id,
          },
        },
      });

      const deleted = await prisma.supplier_items.findUnique({
        where: {
          supplier_id_item_id: {
            supplier_id: supplier.supplier_id,
            item_id: testData.items[0].item_id,
          },
        },
      });

      expect(deleted).toBeNull();
    });

    it("should fail when deleting non-existent link", async () => {
      await expect(
        prisma.supplier_items.delete({
          where: {
            supplier_id_item_id: {
              supplier_id: 99999,
              item_id: 99999,
            },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("CASCADE deletion", () => {
    it("should cascade delete supplier_items when supplier is deleted", async () => {
      const supplier = await prisma.suppliers.create({
        data: {
          supplier_name: "Cascade Delete Supplier",
          contact_info: "cascade@supplier.com",
        },
      });

      await prisma.supplier_items.create({
        data: {
          supplier_id: supplier.supplier_id,
          item_id: testData.items[0].item_id,
          unit_cost: 100.0,
          lead_time_days: 5,
          min_order_qty: 10,
        },
      });

      // Delete the supplier
      await prisma.suppliers.delete({
        where: { supplier_id: supplier.supplier_id },
      });

      // The supplier_items link should be automatically deleted
      const orphanedLink = await prisma.supplier_items.findUnique({
        where: {
          supplier_id_item_id: {
            supplier_id: supplier.supplier_id,
            item_id: testData.items[0].item_id,
          },
        },
      });

      expect(orphanedLink).toBeNull();
    });
  });
});
