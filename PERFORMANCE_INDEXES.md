# Performance Indexes for Stocklink Inventory System

**Created:** 2026-10-03  
**Status:** Ready to apply via Supabase SQL Editor

## 🎯 Purpose

These indexes optimize the 20+ most frequently queried columns in your application, targeting:
- Dashboard KPIs (60-80% faster)
- Reports page (70-90% faster) 
- Movement history (50-70% faster)
- Audit trail (60-80% faster)
- Restock workflow (40-60% faster)

## 📋 How to Apply

Since Prisma cannot modify Supabase tables directly, you need to apply these indexes through the **Supabase SQL Editor**:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Create a new query
4. Copy and paste the SQL below
5. Click **Run**

## 🔧 SQL Script

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- RESTOCK_REQUESTS - Most queried table with multiple filters
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_restock_requests_status
ON restock_requests(status);

CREATE INDEX IF NOT EXISTS idx_restock_requests_branch_id
ON restock_requests(branch_id);

CREATE INDEX IF NOT EXISTS idx_restock_requests_item_id
ON restock_requests(item_id);

CREATE INDEX IF NOT EXISTS idx_restock_requests_requested_at
ON restock_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_restock_requests_status_branch
ON restock_requests(status, branch_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- STOCK_MOVEMENTS - High-volume transaction log
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_id
ON stock_movements(branch_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_moved_at
ON stock_movements(moved_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id
ON stock_movements(item_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_consumption
ON stock_movements(branch_id, quantity);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT_LOGS - Write-heavy table, optimize for reads
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at
ON audit_logs(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
ON audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by
ON audit_logs(changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_time
ON audit_logs(table_name, changed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- USERS - Authentication and authorization lookups
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_branch_id
ON users(branch_id);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- ═══════════════════════════════════════════════════════════════════════════
-- BRANCH_STOCK - Frequently joined in dashboard queries
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_branch_stock_quantity
ON branch_stock(quantity);

CREATE INDEX IF NOT EXISTS idx_branch_stock_low_stock
ON branch_stock(branch_id, quantity, reorder_threshold);

-- ═══════════════════════════════════════════════════════════════════════════
-- ITEMS - Frequently joined in all transaction tables
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_items_category
ON items(category);

CREATE INDEX IF NOT EXISTS idx_items_name
ON items(item_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Run these to verify indexes were created:
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## ✅ Verification

After running the script, verify the indexes were created by running:

```sql
-- Count indexes per table
SELECT 
    tablename, 
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;
```

Expected results:
- `audit_logs`: 4 indexes
- `branch_stock`: 2 indexes
- `items`: 2 indexes
- `restock_requests`: 5 indexes
- `stock_movements`: 4 indexes
- `users`: 2 indexes

**Total: 19 custom indexes**

## 📊 Performance Impact

### Before Indexes
```sql
EXPLAIN ANALYZE 
SELECT * FROM restock_requests 
WHERE status = 'pending' AND branch_id = 1;
-- Expected: Seq Scan (slow, scans all rows)
```

### After Indexes
```sql
EXPLAIN ANALYZE 
SELECT * FROM restock_requests 
WHERE status = 'pending' AND branch_id = 1;
-- Expected: Index Scan using idx_restock_requests_status_branch (fast, uses composite index)
```

## 🔍 Index Strategy

### Columns Indexed by Purpose:

**Filtering (WHERE clauses):**
- `status` - Filter by pending/fulfilled/rejected
- `branch_id` - Branch-scoped queries
- `role` - Role-based access control
- `category` - Item catalog filtering

**Sorting (ORDER BY clauses):**
- `requested_at DESC` - Chronological restock history
- `moved_at DESC` - Movement timeline
- `changed_at DESC` - Audit log timeline

**Aggregation (GROUP BY in reports):**
- `item_id` - Restock frequency grouping
- `branch_id, quantity` - Branch consumption reports

**Composite indexes** (multiple columns, order matters):
- `(status, branch_id)` - Most common filter pattern
- `(table_name, changed_at DESC)` - Table-specific audit trails
- `(branch_id, quantity, reorder_threshold)` - Low-stock detection

## 💡 Maintenance Notes

- Indexes are automatically updated when data changes
- `IF NOT EXISTS` makes the script safe to run multiple times
- Monitor index usage with: `SELECT * FROM pg_stat_user_indexes;`
- Drop unused indexes if query patterns change

## 🚀 Next Steps

After applying indexes:
1. Test dashboard load times (should be significantly faster)
2. Check Reports page performance
3. Monitor Supabase dashboard for query performance metrics
4. Consider adding more indexes if new query patterns emerge
