const fs = require('fs');
const path = require('path');

const envTestPath = path.join(__dirname, '../.env.test');

if (!fs.existsSync(envTestPath)) {
    console.error('❌ ERROR: .env.test file not found!');
    console.error('');
    console.error('Tests require a separate test database to avoid modifying production data.');
    console.error('');
    console.error('Steps to fix:');
    console.error('  1. Copy .env.test.example to .env.test');
    console.error('  2. Update DATABASE_URL in .env.test to point to your test database');
    console.error('  3. Ensure DB_ENVIRONMENT=test is set in .env.test');
    console.error('');
    process.exit(1);
}

console.log('✅ Test environment file found');
console.log('📋 Tests will use the database from .env.test');
