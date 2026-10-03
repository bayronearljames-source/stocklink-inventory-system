# Testing Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs Jest and Supertest for testing.

### 2. Configure Test Database

**Option A: Use your existing Supabase database (NOT RECOMMENDED for tests)**
- Tests will clean and seed data, potentially affecting your dev environment

**Option B: Create a separate test database (RECOMMENDED)**

1. Create a new Supabase project or local PostgreSQL database for testing
2. Copy `.env.test` and update with your test database credentials:

```env
DATABASE_URL="your_test_database_url_here"
JWT_SECRET="test-jwt-secret-key-for-testing-only"
PORT=3001
NODE_ENV=test
```

3. Run migrations on the test database:

```bash
# Set DATABASE_URL to your test database
DATABASE_URL="your_test_db_url" npx prisma migrate deploy
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/items.test.js

# Run with coverage
npm run test:coverage

# Watch mode (auto re-run on changes)
npm run test:watch
```

## Test Database Setup (Detailed)

### Using Supabase (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project named "stocklink-test"
3. Wait for database to initialize
4. Get connection string from Settings > Database > Connection String
5. Update `.env.test` with this URL
6. Run migrations:

```bash
DATABASE_URL="your_supabase_test_url" npx prisma migrate deploy
```

### Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create test database:

```bash
createdb stocklink_test
```

3. Update `.env.test`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stocklink_test"
```

4. Run migrations:

```bash
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stocklink_test" npx prisma migrate deploy
```

## Understanding the Tests

### Test Helpers

**`tests/helpers/testSetup.js`**
- `cleanDatabase()` - Removes all data (runs before tests)
- `seedTestData()` - Creates test items, branches, users, etc.
- `getPrismaClient()` - Returns Prisma client for direct DB access
- `disconnectDatabase()` - Closes connections (runs after tests)

**`tests/helpers/authHelper.js`**
- `generateToken(user)` - Creates JWT for authenticated requests
- `authHeader(token)` - Formats authorization header

### Test Files

Each test file focuses on one feature:

1. **`auth.test.js`** - Login, registration, token validation
2. **`items.test.js`** - CRUD operations for inventory items
3. **`branches.test.js`** - Branch management with role checks
4. **`stockMovements.test.js`** - Sale, withdrawal, adjustment tracking
5. **`restockWorkflow.test.js`** - Complete restock process with triggers and stored procedures

## Running Individual Tests

```bash
# Run only auth tests
npm test -- auth.test.js

# Run only restock workflow tests
npm test -- restockWorkflow.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should create"
```

## Verifying Test Results

After running tests, you should see output like:

```
PASS  tests/integration/items.test.js
PASS  tests/integration/auth.test.js
PASS  tests/integration/stockMovements.test.js
PASS  tests/integration/restockWorkflow.test.js

Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        12.5s
```

## Common Issues

### "Cannot connect to database"
- Check that `.env.test` has correct DATABASE_URL
- Verify test database exists
- Check network/firewall for Supabase connections

### "Relation does not exist"
- Migrations not applied to test database
- Run: `DATABASE_URL="your_test_url" npx prisma migrate deploy`

### "Jest did not exit one second after test run"
- Database connection not closed properly
- Check that `disconnectDatabase()` is in `afterAll` block
- Verify `forceExit: true` is in `jest.config.js`

### Tests fail with "Unique constraint violation"
- Database wasn't cleaned between runs
- Run tests again - `cleanDatabase()` will fix it
- Or manually reset: `DATABASE_URL="your_test_url" npx prisma migrate reset --force`

## Next Steps After Setup

1. ✅ Run all tests to verify setup: `npm test`
2. 📊 Check coverage: `npm run test:coverage`
3. 📝 Read individual test files to understand what's being tested
4. 🔧 Add your own tests as you build new features

## Integration with Development

### Adding Tests for New Features

When you add a new feature:

1. Write the test first (Test-Driven Development)
2. Create a new test file or add to existing one
3. Follow the test structure in existing files
4. Seed any necessary test data
5. Run tests to verify they fail
6. Implement the feature
7. Run tests to verify they pass

### Before Committing Code

```bash
# Run tests to ensure nothing broke
npm test

# Check coverage (aim for >80%)
npm run test:coverage
```

## Documentation

- [Tests README](./tests/README.md) - Detailed test documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
