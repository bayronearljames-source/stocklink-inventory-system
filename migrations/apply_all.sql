-- Initialize an EMPTY disposable database from the repository's SQL migrations.
-- This file uses psql meta-commands and cannot be pasted into Supabase SQL Editor.
-- It is not a reset script and must not be run against a database with data.
--
-- From the repository root, run:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/apply_all.sql
--
-- For PowerShell, use:
--   psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/apply_all.sql

\set ON_ERROR_STOP on

\echo 'Applying migration 001: Initial schema and routines'
\ir 001_init_schema.sql

\echo 'Applying migration 002: Branch role constraint'
\ir 002_add_branch_role_constraint.sql

\echo 'Applying migration 003: Restock transaction fix'
\ir 003_fix_restock_fulfill_transaction.sql

\echo 'Applying migration 004a: Stock movement logging procedure'
\ir 004_add_stock_movements_logging.sql

\echo 'Applying migration 004b: Procedure correction'
\ir 004_fix_procedure.sql

\echo 'Applying migration 005: Missing constraints and triggers'
\ir 005_add_missing_constraints_triggers.sql

\echo 'Applying migration 006: Correct stock movement type'
\ir 006_fix_sp_movement_type.sql

\echo 'Applying migration 007: Performance indexes'
\ir 007_add_performance_indexes.sql

\echo 'Applying migration 008: Stock audit and fulfillment guards'
\ir 008_stock_audit_and_fulfillment_guards.sql

\echo 'All SQL migrations applied successfully.'
