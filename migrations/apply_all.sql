-- Apply all custom SQL migrations to test database
-- Run this file manually if needed

\echo 'Applying migration 002: Branch role constraint'
\i 002_add_branch_role_constraint.sql

\echo 'Applying migration 003: Restock fulfill procedure'
\i 003_fix_restock_fulfill_transaction.sql

\echo 'Applying migration 004: Stock movements logging'
\i 004_add_stock_movements_logging.sql

\echo 'Applying performance indexes'
\i add_performance_indexes.sql

\echo 'All migrations applied successfully!'
