const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('StockLink API is running');
});

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.items.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new item
app.post('/api/items', async (req, res) => {
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});