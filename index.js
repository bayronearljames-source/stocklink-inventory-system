require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("./middleware/auth");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));

// Test route
app.get("/", (req, res) => {
  res.send("StockLink API is running");
});

// Get all items
app.get("/api/items", requireAuth, async (req, res) => {
  try {
    const items = await prisma.items.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new item (admin only)
app.post("/api/items", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { item_name, category, unit_price, unit_of_measure } = req.body;
    const newItem = await prisma.items.create({
      data: { item_name, category, unit_price, unit_of_measure },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all branches
app.get("/api/branches", requireAuth, async (req, res) => {
  try {
    const branches = await prisma.branches.findMany();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new branch (admin only)
app.post(
  "/api/branches",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { branch_name, location, contact_phone } = req.body;
      const newBranch = await prisma.branches.create({
        data: { branch_name, location, contact_phone },
      });
      res.status(201).json(newBranch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get all suppliers
app.get("/api/suppliers", requireAuth, async (req, res) => {
  try {
    const suppliers = await prisma.suppliers.findMany();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new supplier (admin only)
app.post(
  "/api/suppliers",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { supplier_name, contact_info } = req.body;
      const newSupplier = await prisma.suppliers.create({
        data: { supplier_name, contact_info },
      });
      res.status(201).json(newSupplier);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get branch stock — admin sees all branches, everyone else sees only their own
app.get("/api/branch-stock", requireAuth, async (req, res) => {
  try {
    const where =
      req.user.role === "admin" ? {} : { branch_id: req.user.branch_id };
    const stock = await prisma.branch_stock.findMany({
      where,
      include: { branches: true, items: true },
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/set stock for an item at a branch (admin, or a manager for their own branch)
app.post(
  "/api/branch-stock",
  requireAuth,
  requireRole("admin", "branch_manager"),
  async (req, res) => {
    try {
      const { branch_id, item_id, quantity, reorder_threshold } = req.body;
      const targetBranchId = Number(branch_id);

      if (
        req.user.role === "branch_manager" &&
        targetBranchId !== req.user.branch_id
      ) {
        return res
          .status(403)
          .json({ error: "Cannot modify stock for another branch" });
      }

      const newStock = await prisma.branch_stock.create({
        data: {
          branch_id: targetBranchId,
          item_id: Number(item_id),
          quantity: quantity !== undefined ? Number(quantity) : undefined,
          reorder_threshold:
            reorder_threshold !== undefined
              ? Number(reorder_threshold)
              : undefined,
        },
      });
      res.status(201).json(newStock);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get restock requests — admin sees all, everyone else sees only their branch
app.get("/api/restock-requests", requireAuth, async (req, res) => {
  try {
    const where =
      req.user.role === "admin" ? {} : { branch_id: req.user.branch_id };
    const requests = await prisma.restock_requests.findMany({
      where,
      include: { branches: true, items: true },
      orderBy: { requested_at: "desc" },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a restock request — for the logged-in user's own branch
app.post(
  "/api/restock-requests",
  requireAuth,
  requireRole("clerk", "branch_manager", "admin"),
  async (req, res) => {
    try {
      const { item_id, requested_qty } = req.body;

      if (req.user.role !== "admin" && !req.user.branch_id) {
        return res.status(400).json({ error: "User has no branch assigned" });
      }

      const newRequest = await prisma.restock_requests.create({
        data: {
          branch_id: req.user.branch_id, // taken from token, not the request body
          item_id: Number(item_id),
          requested_qty: Number(requested_qty),
        },
      });
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Fulfill a restock request — deducts central stock, adds to branch stock, marks request fulfilled
app.post(
  "/api/restock-requests/:id/fulfill",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const warehouseId = Number(req.body.warehouse_id);

      if (!warehouseId) {
        return res.status(400).json({ error: "warehouse_id is required" });
      }

      await prisma.$executeRaw`CALL sp_fulfill_restock_request(${requestId}::integer, ${warehouseId}::integer)`;

      // The procedure doesn't record who approved it — set that here
      await prisma.restock_requests.update({
        where: { request_id: requestId },
        data: { approved_by: req.user.id },
      });

      const updated = await prisma.restock_requests.findUnique({
        where: { request_id: requestId },
        include: { branches: true, items: true },
      });
      res.json(updated);
    } catch (error) {
      const msg = error.message || "";
      if (msg.includes("not found or already processed")) {
        return res
          .status(404)
          .json({ error: "Request not found or already processed" });
      }
      if (msg.includes("Insufficient central stock")) {
        return res
          .status(400)
          .json({ error: "Insufficient central stock for this item" });
      }
      res.status(500).json({ error: msg });
    }
  },
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
