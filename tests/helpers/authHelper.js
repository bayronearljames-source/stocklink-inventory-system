const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for testing
 */
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
    },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '24h' }
  );
}

/**
 * Create authorization header for supertest
 */
function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  generateToken,
  authHeader,
};
