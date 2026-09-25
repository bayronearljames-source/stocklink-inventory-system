// Usage: node scripts/create-user.js <username> <password> <role> [branch_id]
// Examples:
//   node scripts/create-user.js admin1 Passw0rd! admin
//   node scripts/create-user.js clerk1 Passw0rd! clerk 1
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const [username, password, role, branchId] = process.argv.slice(2);
  if (!username || !password || !role) {
    console.log('Usage: node scripts/create-user.js <username> <password> <role> [branch_id]');
    process.exit(1);
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: { username, password_hash, role, branch_id: branchId ? Number(branchId) : null },
  });
  console.log('Created user', user.user_id, user.username, user.role);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});