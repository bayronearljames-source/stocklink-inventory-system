// ⚠️  DEV UTILITY — resets ALL demo user passwords to a fixed value.
// DO NOT run this in production or during a live demo/grading session.
// Usage: node scripts/reset-passwords.js
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Admin1234!';

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = [
    { username: 'testadmin',   role: 'admin' },
    { username: 'testmanager', role: 'branch_manager' },
    { username: 'testclerk',   role: 'clerk' },
  ];

  for (const u of users) {
    await prisma.users.updateMany({
      where: { username: u.username },
      data: { password_hash: hash },
    });
    console.log(`✅  Reset password for [${u.role}] ${u.username}`);
  }

  console.log('\n=== Login credentials ===');
  console.log('Username     | Password     | Role');
  console.log('-------------|--------------|---------------');
  users.forEach(u => console.log(`${u.username.padEnd(13)}| ${DEMO_PASSWORD.padEnd(14)}| ${u.role}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

