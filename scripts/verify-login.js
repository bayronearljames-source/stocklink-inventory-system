// Tests bcrypt compare directly against the DB hash — bypasses the HTTP server entirely
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_PASSWORD = 'Admin1234!';

async function main() {
  const users = await prisma.users.findMany({
    select: { username: true, password_hash: true, role: true },
  });

  console.log(`Testing password: "${TEST_PASSWORD}"\n`);
  for (const u of users) {
    const match = await bcrypt.compare(TEST_PASSWORD, u.password_hash);
    console.log(`[${match ? '✅ MATCH' : '❌ FAIL '}]  ${u.username} (${u.role})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

