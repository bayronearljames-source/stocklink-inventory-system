const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient(); // or import the shared instance your items routes use
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.users.findFirst({
      where: { username },
      include: { branches: true } // Include branch details if user is assigned to a branch
    });
    const valid = user && (await bcrypt.compare(password, user.password_hash));
    // Same message for both failures so the API doesn't reveal which usernames exist.
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user.user_id, role: user.role, branch_id: user.branch_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Include branch name in the response for managers and clerks
    const userResponse = {
      ...payload,
      username: user.username,
      branch_name: user.branches?.branch_name || null
    };

    res.json({ token, user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;