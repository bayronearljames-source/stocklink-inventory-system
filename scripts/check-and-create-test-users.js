// Check if test users exist and create them if needed
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testUsers = [
  { username: 'testadmin', password: 'Admin1234!', role: 'admin', branch_id: null },
  { username: 'testmanager', password: 'Admin1234!', role: 'manager', branch_id: 1 },
  { username: 'testclerk', password: 'Admin1234!', role: 'clerk', branch_id: 1 }
];

(async () => {
  console.log('Checking existing users...\n');

  // List all current users
  const existingUsers = await prisma.users.findMany({
    select: { user_id: true, username: true, role: true, branch_id: true }
  });

  console.log('Current users in database:');
  if (existingUsers.length === 0) {
    console.log('  (no users found)');
  } else {
    existingUsers.forEach(u => {
      console.log(`  - ${u.username} (${u.role}) [ID: ${u.user_id}, Branch: ${u.branch_id || 'N/A'}]`);
    });
  }

  console.log('\n---\n');

  // Check and create test users
  for (const testUser of testUsers) {
    const existing = await prisma.users.findUnique({
      where: { username: testUser.username }
    });

    if (existing) {
      console.log(`✓ ${testUser.username} already exists (${testUser.role})`);
    } else {
      const password_hash = await bcrypt.hash(testUser.password, 10);
      const created = await prisma.users.create({
        data: {
          username: testUser.username,
          password_hash,
          role: testUser.role,
          branch_id: testUser.branch_id
        }
      });
      console.log(`✓ Created ${testUser.username} (${testUser.role}) [ID: ${created.user_id}]`);
    }
  }

  console.log('\n✅ Test users ready! You can now log in with:');
  console.log('   - testadmin / Admin1234!');
  console.log('   - testmanager / Admin1234!');
  console.log('   - testclerk / Admin1234!');

  await prisma.$disconnect();
})().catch((e) => {
  console.error('Error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
