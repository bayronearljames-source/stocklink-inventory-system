# Stocklink Testing - Complete Step-by-Step Guide

**Date:** 2026-10-03  
**Time Required:** ~30 minutes for first-time setup

---

## Prerequisites Checklist

Before you begin, make sure you have:
- ✅ Node.js installed (check with `node --version`)
- ✅ npm installed (check with `npm --version`)
- ✅ Git repository cloned locally
- ✅ Main project dependencies installed (`npm install` in root)

---

## Part 1: Set Up Test Database (15 minutes)

### Option A: Using Supabase (Recommended)

**Step 1: Create a New Supabase Project**

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in project details:
   - Name: `stocklink-test`
   - Database Password: Choose a strong password (save it!)
   - Region: Same as your main project (AP Southeast 1)
4. Click **"Create new project"**
5. Wait 2-3 minutes for database to initialize

**Step 2: Get Connection String**

1. In your new test project, go to **Settings** (gear icon)
2. Click **Database** in the left menu
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set in Step 1

**Step 3: Update .env.test File**

1. Open `.env.test` in the root of your project
2. Replace the DATABASE_URL line with your test connection string:

```env
DATABASE_URL="postgresql://postgres.yourref:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="test-jwt-secret-key-for-testing-only"
PORT=3001
NODE_ENV=test
```

3. Save the file

**Step 4: Run Migrations on Test Database**

Open terminal in project root and run:

```bash
DATABASE_URL="your_test_connection_string_here" npx prisma migrate deploy
```

Replace `your_test_connection_string_here` with the actual connection string.

**Expected Output:**
```
✔ Prisma schema loaded from prisma/schema.prisma
✔ Migrations applied successfully
```

### Option B: Using Local PostgreSQL (Advanced)

**If you have PostgreSQL installed locally:**

1. Create test database:
   ```bash
   createdb stocklink_test
   ```

2. Update `.env.test`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stocklink_test"
   JWT_SECRET="test-jwt-secret-key-for-testing-only"
   PORT=3001
   NODE_ENV=test
   ```

3. Run migrations:
   ```bash
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stocklink_test" npx prisma migrate deploy
   ```

---

## Part 2: Verify Test Setup (5 minutes)

**Step 1: Check Test Dependencies**

Run this command to verify Jest and Supertest are installed:

```bash
npm list jest supertest
```

**Expected Output:**
```
stocklink-inventory-system@1.0.0
├── jest@30.5.2
└── supertest@7.3.1
```

**Step 2: Verify Test Files Exist**

Run this command:

```bash
npm test -- --listTests
```

**Expected Output (should list 5 test files):**
```
tests/integration/auth.test.js
tests/integration/branches.test.js
tests/integration/items.test.js
tests/integration/restockWorkflow.test.js
tests/integration/stockMovements.test.js
```

---

## Part 3: Run Your First Test (5 minutes)

**Step 1: Run All Tests**

```bash
npm test
```

**What Happens:**
1. Jest starts up
2. Each test file runs in sequence
3. Database is cleaned before each test suite
4. Test data is seeded automatically
5. Tests run against your test database
6. Results are displayed

**Expected Output (if all pass):**
```
PASS  tests/integration/items.test.js
  Items CRUD Operations
    ✓ should create a new item (150ms)
    ✓ should retrieve all items (45ms)
    ✓ should update item details (80ms)
    ...

PASS  tests/integration/auth.test.js
PASS  tests/integration/stockMovements.test.js
PASS  tests/integration/restockWorkflow.test.js
PASS  tests/integration/branches.test.js

Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        12.5s
```

**Step 2: Understanding Test Results**

- ✓ Green checkmark = Test passed
- ✗ Red X = Test failed
- Numbers in parentheses = Time taken

---

## Part 4: Run Individual Test Suites (Optional)

**Test Only Authentication:**
```bash
npm test -- auth.test.js
```

**Test Only Items CRUD:**
```bash
npm test -- items.test.js
```

**Test Only Restock Workflow:**
```bash
npm test -- restockWorkflow.test.js
```

**Test Only Stock Movements:**
```bash
npm test -- stockMovements.test.js
```

**Test Only Branches:**
```bash
npm test -- branches.test.js
```

---

## Part 5: Generate Coverage Report (5 minutes)

**Step 1: Run Tests with Coverage**

```bash
npm run test:coverage
```

**Step 2: View Coverage Report**

After tests complete, open:
```
coverage/lcov-report/index.html
```

in your browser to see a visual coverage report.

**What Coverage Means:**
- **Green (>80%)**: Good coverage
- **Yellow (50-80%)**: Needs more tests
- **Red (<50%)**: Poor coverage

---

## Troubleshooting Common Issues

### Issue 1: "Cannot connect to database"

**Solution:**
1. Verify `.env.test` has correct DATABASE_URL
2. Check that test database exists
3. Try pinging the database:
   ```bash
   DATABASE_URL="your_test_url" npx prisma db pull
   ```

### Issue 2: "Relation does not exist"

**Error means:** Tables don't exist in test database

**Solution:**
```bash
DATABASE_URL="your_test_url" npx prisma migrate deploy
```

### Issue 3: "Jest did not exit"

**Solution:** This is normal with our config. Tests still passed! To fix permanently:
1. Check that `forceExit: true` is in `jest.config.js` ✓ (already there)
2. The warning is informational only

### Issue 4: Tests fail with "Unique constraint violation"

**Solution:** Database wasn't cleaned between runs. Run again - the cleanup will fix it.

Or manually reset:
```bash
DATABASE_URL="your_test_url" npx prisma migrate reset --force
```

### Issue 5: "bcrypt" errors on Windows

**Solution:**
```bash
npm rebuild bcrypt
```

---

## Watch Mode (Auto Re-run Tests)

**For Active Development:**

```bash
npm run test:watch
```

This will:
- Watch for file changes
- Auto re-run tests when you save files
- Great for TDD (Test-Driven Development)

**To exit watch mode:** Press `q`

---

## Understanding Test Output

### Example Test Output Explained:

```
PASS  tests/integration/restockWorkflow.test.js
  Restock Request Workflow
    Restock Request Creation
      ✓ should create a restock request (120ms)
      ✓ should auto-create restock request when stock is low (trigger) (180ms)
    Restock Request Approval
      ✓ should approve a pending restock request (95ms)
    Restock Request Fulfillment (Stored Procedure)
      ✓ should fulfill approved restock request and update stock (250ms)
      ✓ should create stock movement record during fulfillment (200ms)
```

**Reading this:**
- `PASS` = All tests in this file passed
- Nested structure shows test organization
- Time in `(ms)` shows how long each test took
- `(trigger)` and `(Stored Procedure)` labels show what's being tested

---

## What Each Test Suite Does

### 1. auth.test.js
- Tests login with valid/invalid credentials
- Tests JWT token generation
- Tests role validation

### 2. items.test.js
- Tests creating items
- Tests reading/filtering items
- Tests updating item details
- Tests deleting items with FK constraints
- Tests price validation

### 3. branches.test.js
- Tests branch CRUD operations
- Tests role-based access (admin only)
- Tests foreign key constraints

### 4. stockMovements.test.js
- Tests recording sales, withdrawals, adjustments
- Tests audit log trigger (`trg_audit_branch_stock`)
- Tests low stock detection

### 5. restockWorkflow.test.js
- Tests creating restock requests
- Tests auto-restock trigger (`trg_branch_stock_low`)
- Tests approval workflow
- Tests stored procedure (`sp_fulfill_restock_request`)
- Tests stock increase after fulfillment

---

## Next Steps After Testing

### If All Tests Pass ✓

1. **Commit your work:**
   ```bash
   git add .
   git commit -m "feat: add comprehensive integration testing suite"
   git push
   ```

2. **Generate coverage report:**
   ```bash
   npm run test:coverage
   ```

3. **Review uncovered code** and add more tests if needed

4. **Move to load testing** (next phase)

### If Tests Fail ✗

1. **Read the error message** - Jest shows exactly what failed
2. **Check the test file** to understand what's expected
3. **Verify your database** has the right schema
4. **Check for typos** in field names (e.g., `reorder_threshold` vs `reorder_level`)
5. **Ask for help** - share the error message

---

## Quick Reference Commands

```bash
# Install dependencies (if not done)
npm install

# Run all tests
npm test

# Run specific test file
npm test -- items.test.js

# Run with coverage
npm run test:coverage

# Watch mode (auto re-run)
npm run test:watch

# List all test files
npm test -- --listTests

# Apply migrations to test DB
DATABASE_URL="test_url" npx prisma migrate deploy
```

---

## Tips for Success

1. ✅ **Always use a separate test database** - never test on your dev database
2. ✅ **Run tests before committing** - catch bugs early
3. ✅ **Read test output carefully** - errors tell you exactly what's wrong
4. ✅ **Start with one test file** - don't run all at once when debugging
5. ✅ **Keep your test database connection string safe** - don't commit it

---

## Getting Help

**If you get stuck:**

1. Check the error message - it usually tells you what's wrong
2. Read `tests/README.md` for detailed documentation
3. Verify your `.env.test` file is correct
4. Make sure migrations ran successfully
5. Try running tests one at a time to isolate issues

**Common Questions:**

**Q: How long should tests take?**  
A: 10-15 seconds for all 5 test suites

**Q: Will tests affect my dev database?**  
A: No, if you use a separate test database URL in `.env.test`

**Q: Can I modify the tests?**  
A: Yes! Tests are just JavaScript files. Feel free to add more.

**Q: What if I don't have Supabase?**  
A: Use local PostgreSQL (see Option B in Part 1)

---

## Success Criteria

You're done when you see:

```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
```

🎉 **Congratulations!** Your integration tests are working!

---

**Questions?** Check `tests/README.md` or `TESTING_SETUP.md` for more details.
