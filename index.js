const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('./middleware/auth');   // ← ADD THIS LINE

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));          // ← ADD THIS LINE

// Test route
app.get('/', (req, res) => {
  res.send('StockLink API is running');
});

// Get all items
app.get('/api/items', requireAuth, async (req, res) => {  // ← ADD requireAuth HERE
  try {
    const items = await prisma.items.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new item
app.post('/api/items', requireAuth, async (req, res) => { // ← ADD requireAuth HERE
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