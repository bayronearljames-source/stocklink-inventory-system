# Stocklink Integration Tests

This directory contains integration tests for the Stocklink Inventory Management System.

## Test Structure

```
tests/
├── helpers/           # Test utilities and setup
│   ├── authHelper.js     # JWT token generation for tests
│   └── testSetup.js      # Database seeding and cleanup
├── integration/       # Integration tests
│   ├── auth.test.js           # Authentication flow
│   ├── branches.test.js       # Branch CRUD operations
│   ├── items.test.js          # Item CRUD operations
│   ├── stockMovements.test.js # Stock movement tracking
│   └── restockWorkflow.test.js # Complete restock workflow
└── unit/             # Unit tests (future)
```

## Running Tests

### Prerequisites

1. **Set up test database** - Create a separate test database to avoid affecting development data:
   ```bash
   # Update .env.test with your test database URL
   DATABASE_URL="postgresql://user:password@localhost:5432/stocklink_test"
   ```

2. **Run migrations on test database**:
   ```bash
   DATABASE_URL="your_test_db_url" npx prisma migrate deploy
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage
```

## Test Coverage

### 1. Authentication Flow (`auth.test.js`)
- ✅ Login with valid credentials (admin, manager, clerk)
- ✅ Reject invalid passwords
- ✅ Reject non-existent users
- ✅ Reject missing credentials

### 2. Branch Management (`branches.test.js`)
- ✅ GET all branches (authenticated)
- ✅ POST create branch (admin only)
- ✅ PUT update branch (admin only)
- ✅ DELETE branch (admin only, with constraint checks)
- ✅ Role-based access control

### 3. Items Management (`items.test.js`)
- ✅ Create items with validation
- ✅ Read all items and filter by category
- ✅ Update item details
- ✅ Delete items (with foreign key constraint handling)
- ✅ Price validation (positive values, decimal handling)

### 4. Stock Movements (`stockMovements.test.js`)
- ✅ Record sale movements and reduce stock
- ✅ Record withdrawal movements
- ✅ Record adjustment movements
- ✅ Audit log trigger on stock updates
- ✅ Low stock detection

### 5. Restock Workflow (`restockWorkflow.test.js`)
- ✅ Create restock requests
- ✅ Auto-create requests when stock is low (trigger test)
- ✅ Approve restock requests
- ✅ Fulfill requests using stored procedure `sp_fulfill_restock_request`
- ✅ Verify stock increase after fulfillment
- ✅ Verify stock movement records created
- ✅ Reject restock requests

## Critical Features Tested

### Database Triggers
1. **Low Stock Auto-Restock Trigger** (`trg_branch_stock_low`)
   - Automatically creates restock request when stock < reorder_level
   - Tested in `restockWorkflow.test.js`

2. **Audit Log Trigger** (`trg_audit_branch_stock`)
   - Logs all INSERT/UPDATE/DELETE on branch_stock
   - Tested in `stockMovements.test.js`

### Stored Procedures
1. **`sp_fulfill_restock_request(request_id, user_id)`**
   - Updates request status to 'fulfilled'
   - Increases branch_stock quantity
   - Creates stock_movement record
   - Tested in `restockWorkflow.test.js`

### Role-Based Access Control
- Admin: Full access to all operations
- Manager: Branch-specific operations, restock requests
- Clerk: Read access, stock movements

## Test Data

Each test suite automatically seeds the database with:
- 2 test items (Test Widget A, Test Widget B)
- 1 test branch with location and contact
- 1 test supplier
- 3 test users (admin, manager, clerk) with password `password123`
- Initial branch stock records

Data is cleaned up before each test run to ensure isolation.

## Writing New Tests

### Basic Test Structure

```javascript
const { cleanDatabase, seedTestData, disconnectDatabase, getPrismaClient } = require('../helpers/testSetup');
const { generateToken } = require('../helpers/authHelper');

describe('Feature Name', () => {
  let testData;
  let prisma;

  beforeAll(async () => {
    await cleanDatabase();
    testData = await seedTestData();
    prisma = getPrismaClient();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### Using Auth Tokens

```javascript
const adminToken = generateToken(testData.users.admin);
const { Authorization } = authHeader(adminToken);

// Use in supertest requests
await request(app)
  .get('/api/branches')
  .set('Authorization', `Bearer ${adminToken}`);
```

## Troubleshooting

### Tests hanging or timing out
- Ensure `forceExit: true` is in `jest.config.js`
- Check that `disconnectDatabase()` is called in `afterAll`

### Database connection errors
- Verify `.env.test` has correct DATABASE_URL
- Ensure test database exists and migrations are applied
- Check that test database is accessible

### Foreign key constraint errors
- Tests clean database in proper order (reverse dependency)
- Check that `cleanDatabase()` is called in `beforeAll`

## Next Steps

- [ ] Add unit tests for utility functions
- [ ] Add API endpoint tests using full Express app
- [ ] Add performance benchmarks
- [ ] Set up CI/CD pipeline with automated tests
- [ ] Add E2E tests for frontend

## Related Documentation

- [Database Schema](../migrations/README.md)
- [Performance Indexes](../PERFORMANCE_INDEXES.md)
- [Project Roadmap](../.claude/memory/stocklink-roadmap.md)
