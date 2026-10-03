# Stocklink Testing - Quick Start Card

## 🚀 Fast Track (5 Minutes)

### 1️⃣ Set Up Test Database
```bash
# Create new Supabase project named "stocklink-test"
# Get connection string from Settings → Database
# Update .env.test with your connection string
```

### 2️⃣ Run Migrations
```bash
DATABASE_URL="your_test_connection_string" npx prisma migrate deploy
```

### 3️⃣ Run Tests
```bash
npm test
```

✅ **Success looks like:**
```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Time:        12.5s
```

---

## 📋 Essential Commands

```bash
npm test                   # Run all tests
npm run test:coverage     # Coverage report
npm run test:watch        # Auto re-run on changes
npm test -- items.test.js # Run specific test
```

---

## 🔧 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to database | Check `.env.test` DATABASE_URL |
| "Relation does not exist" | Run migrations on test DB |
| Tests hang | Normal - they still passed! |
| Unique constraint error | Run tests again (cleanup will fix) |

---

## 📁 What Gets Tested?

✅ Authentication & JWT  
✅ Items, Branches, Suppliers CRUD  
✅ Stock movements (sale, withdrawal, adjustment)  
✅ Restock workflow (request → approve → fulfill)  
✅ Database triggers (auto-restock, audit logs)  
✅ Stored procedure (sp_fulfill_restock_request)  
✅ Role-based access control  

---

## ⚠️ Important Notes

- **Use separate test database** - never test on dev DB!
- Test database gets cleaned before each run
- All test data is auto-seeded (items, branches, users)
- Default test users: `testadmin`, `testmanager`, `testclerk` (password: `password123`)

---

## 📚 Full Documentation

- **Step-by-step guide:** `TESTING_STEP_BY_STEP.md`
- **Complete reference:** `tests/README.md`
- **Setup instructions:** `TESTING_SETUP.md`

---

**Last Updated:** 2026-10-03
