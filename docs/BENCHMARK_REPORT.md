# Query Benchmark Report

Environment: Supabase PostgreSQL (production), measured with EXPLAIN ANALYZE.

## 1. Pending restock requests
Query: SELECT * FROM restock_requests WHERE status = 'pending';
Default plan: Seq Scan, execution time 0.040 ms (table has 3 rows)
With sequential scans disabled (test only): Index Scan using
idx_restock_requests_status_branch, Index Cond: status = 'pending',
execution time 5.799 ms
Note: At this table size a sequential scan is cheaper, so the planner chooses it
by default. The forced test confirms the composite index is valid and usable
for status filters; it benefits queries as the table grows.

## 2. Latest audit log entries
Query: SELECT * FROM audit_logs ORDER BY changed_at DESC LIMIT 20;
Plan: Limit -> Sort (quicksort, 29 kB) -> Seq Scan on audit_logs, 9 rows
Execution time: 1.780 ms
Relevant index: idx_audit_logs_changed_at

## 3. Stock movements by branch
Query: SELECT * FROM stock_movements WHERE branch_id = 1;
Plan: Seq Scan on stock_movements, filter on branch_id, 2 rows removed
Execution time: 1.116 ms
Relevant index: idx_stock_movements_branch_id

## Analysis
The tables currently hold very few rows (2 to 9), so the PostgreSQL planner chose
sequential scans, which are cheaper than index lookups at this size. The indexes
listed above are applied in production and become beneficial as data grows.
All three queries run in under 2 ms.