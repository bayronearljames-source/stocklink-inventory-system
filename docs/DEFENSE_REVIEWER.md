# StockLink Final Defense Reviewer

Use this as a rehearsal guide, not as a script to memorize. The panel may point to a table, API route, migration, or Git commit and ask a team member to explain it. Be ready to explain the design in your own words and to show the evidence in the repository or live system.

## 1. One-minute project introduction

> StockLink is a cloud-hosted, multi-branch inventory and restocking system for a hardware and tools distributor. It keeps a master item catalog, supplier-item pricing, stock at branches and the central warehouse, and a traceable restock workflow. The client uses an Express API and Prisma to access PostgreSQL on Supabase. Database constraints protect valid relationships and quantities; PostgreSQL triggers create audit records and low-stock requests, while a stored procedure fulfills a restock request as one database transaction. Access is authenticated with JWTs and restricted by role and branch. We designed it to demonstrate database architecture and automation, not just CRUD screens.

If asked about a feature you have not personally verified, say so and point to the code or test that needs checking. Do not claim every production permission or performance result was tested unless you can show the evidence.

## 2. Suggested presentation flow (about 10 minutes)

| Time | Presenter action | What to explain |
|---|---|---|
| 0:00–0:45 | Introduce StockLink and the inventory problem | Multiple branches need a consistent catalog, stock view, and controlled replenishment. |
| 0:45–2:15 | Show the architecture diagram | Browser → Vercel frontend → Vercel Express API → Prisma → Supabase PostgreSQL. The frontend does not connect directly to PostgreSQL. |
| 2:15–4:00 | Show the ERD and table groups | Explain 11 tables, keys, foreign keys, composite keys, and junction tables. Follow one item from catalog to branch stock and restock. |
| 4:00–6:30 | Demonstrate a prepared read-only user journey | Sign in with the approved demo account; show the dashboard, catalog, central stock, branch stock, queue/history, suppliers, and audit/report views. Explain role-specific access. |
| 6:30–8:00 | Explain server-side automation | Show the low-stock trigger, audit triggers, and `sp_fulfill_restock_request`; trace one fulfillment from request to stock movement and audit rows. |
| 8:00–9:00 | Show tests, indexes, and deployment | Show test suites and the disposable-test-database guard; discuss measured plans honestly; show the deployed frontend/API and migration files. |
| 9:00–10:00 | Summarize and invite questions | State the main design choices, limitations, and what you would improve next. |

### Assign the three required speaking roles

Write the actual names beside these before presenting. Each student should be able to explain the complete request-to-database lifecycle, even if they lead only one section.

- **DBA / Cloud Infrastructure:** ____________________ — schema, constraints, Supabase, restricted connection role, backup and deployment configuration.
- **Database Programmer / Query Optimization:** ____________________ — triggers, stored procedure, transactions, indexes, execution plans, tests.
- **UI Connector / Git Workflow:** ____________________ — React client, API calls, authentication flow, Vercel projects, pull requests and branch protection.

## 3. Safe live-demo sequence

1. Open the deployed StockLink frontend and confirm the expected URL before the panel arrives.
2. Sign in with the team's approved demo account. Keep the password private; do not display `.env`, Vercel secret values, database URLs, JWT secrets, or password hashes.
3. Show the central dashboard, Master Catalog, Central Warehouse, Branch Stock Levels, Restock Queue, Suppliers & Pricing, and one report/audit view.
4. Explain the expected role restrictions. If showing a manager or clerk account, use a prepared account and show that its data is scoped to its assigned branch.
5. Prefer read-only production operations. Do not create, edit, delete, fulfill, reject, or run test cleanup against production during the defense. If the instructor requires a write demonstration, use the disposable test database or a test environment that the team has explicitly confirmed is isolated.
6. If the live service is slow or unavailable, explain the architecture from the ERD and source, then use pre-captured screenshots. Do not improvise SQL writes to recover the demo.

### Restock lifecycle to narrate

1. A clerk or branch manager submits a request; the API takes the branch identity from the authenticated token rather than trusting a branch ID supplied by the browser.
2. PostgreSQL's low-stock trigger can create a pending restock request when an inventory quantity drops below its reorder threshold, avoiding duplicate pending requests for that branch/item.
3. An admin selects a source warehouse and fulfills the request.
4. The API calls `sp_fulfill_restock_request(request_id, warehouse_id, approved_by)` with parameterized values.
5. The procedure locks the pending request and selected central-stock row, checks availability, deducts warehouse stock, adds the quantity to branch stock, records a stock movement, and marks the request fulfilled.
6. The transaction either commits all related changes or rolls back on an error. Database triggers write audit records for stock changes, including before/after JSON snapshots.

## 4. Architecture and database facts to know

### System path

```text
React/Vite browser client
        │ HTTPS JSON API calls (VITE_API_URL)
        ▼
Express API on Vercel
  ├─ JWT authentication and role checks
  ├─ Prisma ORM / parameterized query API
  └─ PostgreSQL procedure call for fulfillment
        │ DATABASE_URL held by the server environment
        ▼
Supabase PostgreSQL
  ├─ 11 relational tables and constraints
  ├─ low-stock and audit triggers
  ├─ fulfillment stored procedure
  └─ indexes and audit history
```

The production frontend and API are separate Vercel projects. The frontend uses `VITE_API_URL` to reach the API. Database credentials and `JWT_SECRET` belong only in private server-side environment variables; never put them in a `VITE_` variable because Vite exposes those values to the browser bundle.

### Table groups (11 tables)

| Purpose | Tables | Why they exist |
|---|---|---|
| Master data | `items`, `branches`, `central_warehouse`, `suppliers`, `users` | Store each business entity once and reference it by key. |
| Many-to-many relationships | `supplier_items`, `branch_stock`, `central_stock` | Connect suppliers/items, branches/items, and warehouses/items; store relationship-specific facts such as unit cost/lead time or quantity. The latter two use composite primary keys. |
| Operations/history | `restock_requests`, `stock_movements`, `audit_logs` | Track requests, physical stock changes, and before/after changes. |

There are three clear associative relationships: supplier↔item through `supplier_items`; branch↔item through `branch_stock`; warehouse↔item through `central_stock`. Their intersection attributes belong on the junction row, not redundantly on `items` or `branches`.

### Constraints worth pointing out

- `users.username` is unique; role values are restricted to `admin`, `branch_manager`, and `clerk`.
- Stock quantities cannot go below zero; request and movement quantities must be positive; prices/costs and reorder thresholds have non-negative checks.
- Composite keys identify one branch/item or warehouse/item stock row.
- Foreign-key delete behavior is explicit: for example, supplier-item links cascade with supplier deletion, while stock/request relationships generally restrict deletion; user attribution can become null when an associated user is deleted.
- `audit_logs.old_value` and `new_value` are JSONB snapshots. `record_id` alone is not the full key for composite-key stock rows; the row snapshot also preserves its branch/warehouse identity.

## 5. Source-code and SQL landmarks

Open these files in VS Code before the defense so you can jump to them quickly.

| What the panel may ask about | Where to show it | What to point out |
|---|---|---|
| Relational model and key mapping | `prisma/schema.prisma` | 11 models, relations, composite `@@id` keys, and indexes represented in Prisma. SQL migrations hold some checks/triggers not fully expressible in the Prisma model. |
| Initial tables, checks, and automation | `migrations/001_init_schema.sql` | Base entities; constraints; `fn_check_restock_threshold`; `trg_branch_stock_low`; initial branch-stock audit trigger; original fulfillment procedure. Later migrations refine the initial implementation. |
| Role and branch authorization | `middleware/auth.js`; API routes in `index.js` | `requireAuth` verifies Bearer JWT and sets `req.user`; `requireRole` returns 403 for a role not allowed. Branch-scoped handlers use `req.user.branch_id`. |
| Login and password handling | `routes/auth.js` | Username lookup via Prisma; `bcrypt.compare`; same invalid-credentials response; JWT includes user ID, role, branch and expires after 8 hours. |
| Fulfillment transaction and stock audit | `migrations/008_stock_audit_and_fulfillment_guards.sql` | Procedure locks request and central stock with `FOR UPDATE`, checks quantity, updates both stock locations, inserts movement, changes request status; triggers write audit snapshots and actor attribution. |
| Parameterized procedure invocation | `index.js` near `/api/restock-requests/:id/fulfill` | Prisma `$executeRaw` tagged template passes parameters rather than concatenating untrusted SQL strings. |
| Index choices | `migrations/007_add_performance_indexes.sql` and `PERFORMANCE_INDEXES.md` | Indexes target observed filters/sorts such as request status/branch, movement history, audit timestamps, and item lookup. Explain the trade-off: indexes cost storage and slow writes slightly, so they should match real query patterns. |
| Test isolation | `scripts/check-test-env.js`, `tests/helpers/testSetup.js`, `tests/integration/` | Test setup checks for a distinct disposable database because the suites clear and seed rows. Never point Jest at production. |
| Deployment topology | `docs/DEPLOYMENT.md` and Vercel project dashboards | Two Vercel projects: API and web. Keep environment values private, and check each project's correct production/preview variables. |
| Submission evidence | `docs/Parenimo-Stocklink Schema.pdf`, `docs/DATA_DICTIONARY.csv`, `docs/BENCHMARK_REPORT.md`, `migrations/` | ERD, field dictionary, measured plans, and sequential SQL history. |

The migration directory contains two files numbered `004` (`004_add_stock_movements_logging.sql` and `004_fix_procedure.sql`). Explain that the applied sequence is defined by `migrations/apply_all.sql`; do not assume a filename number by itself proves execution order. If asked, open `apply_all.sql` and show the actual include order.

## 6. Likely panel questions and answer outlines

### Database design

**Why is this more than a basic CRUD inventory app?**

It models stock independently per branch and warehouse, supplier-specific terms for an item, request lifecycles, stock movement history, and automatic audit/low-stock behavior. The workflow crosses related tables and must preserve consistency when fulfillment occurs.

**How did you apply 3NF?**

Each entity has its own table and key. Branch and item names are not copied into stock rows; those rows store foreign keys. Supplier-specific price and delivery terms depend on the supplier/item pair and therefore live on `supplier_items`. Stock quantity depends on the branch/item or warehouse/item pair. The audit snapshots are intentional historical evidence, not a second current-state catalog.

**What are your many-to-many relationships?**

Supplier-to-item via `supplier_items` (cost, lead time, minimum order quantity); branch-to-item via `branch_stock` (quantity, threshold, restock timestamp); warehouse-to-item via `central_stock` (quantity). Composite keys prevent duplicate pair rows.

**What happens if someone deletes a referenced parent row?**

The configured foreign-key action decides: restrictive relationships reject deletion while dependent operational rows exist; supplier links can cascade; user references used only for attribution can be set null. The database enforces this even if the request bypasses the UI. Show the specific FK in `migrations/001_init_schema.sql` or `prisma/schema.prisma` rather than answering generically.

### Triggers and transaction

**Why put audit logging in PostgreSQL instead of the API?**

A trigger observes the row mutation at the database boundary, so the audit write is coupled to the same database operation even when the update did not originate in the normal UI path. It records old/new row snapshots. The API supplies the actor ID transaction-locally for fulfillment where available.

**Why a stored procedure for fulfillment?**

Fulfillment is a multi-row business operation: check a pending request, verify source stock, decrement the warehouse, increment the destination branch, record the movement, and update status. Putting that sequence in PostgreSQL keeps it atomic and centralizes the consistency rule.

**How do you prevent two admins from fulfilling the same request or overspending stock?**

The procedure selects the pending request and central-stock row `FOR UPDATE`. A competing transaction must wait; after the first transaction changes the request/status or quantity, the second rechecks and raises an exception instead of applying a duplicate transfer. The procedure is transactional, so an exception rolls back its partial work.

**What does the low-stock trigger do?**

After an update of `branch_stock.quantity`, it compares quantity with that row's reorder threshold and inserts a pending request only if one does not already exist for the same branch/item. Show `fn_check_restock_threshold` and its trigger. Be clear that this is the current trigger logic; do not claim a separate concurrency stress test passed unless you can show its test output.

### Security and architecture

**How does the browser reach the database?**

It does not connect directly. The React client makes HTTPS JSON calls to Express; Express verifies the JWT and authorization, then Prisma uses the server-only `DATABASE_URL` to query PostgreSQL.

**How are users authenticated?**

Passwords are stored as bcrypt hashes, not plaintext. Login compares the supplied password with the stored hash, then signs an expiring JWT containing user ID, role, and branch ID. Protected routes verify the Bearer token.

**How do you stop a branch user from changing another branch's data?**

The API derives the branch identity from `req.user.branch_id` in the verified token and uses it in branch-scoped queries; mutation handlers also check requested branch IDs against that claim. Role middleware restricts admin-only actions. UI hiding is convenience, not the security boundary; API checks are.

**How do you prevent SQL injection?**

Most queries use Prisma's structured query API, which parameterizes values. The stored-procedure call uses Prisma's tagged `$executeRaw` template. Do not concatenate user input into raw SQL. Be prepared to show the actual call in `index.js`.

**Does the application use database administrator credentials?**

Answer from the current Vercel `DATABASE_URL` configuration and the restricted role/grants evidence. The repository has a limited application role intended for runtime use, but a code reviewer cannot prove what a private deployment variable currently contains. If you cannot show the configured role without revealing its password, say you verified the username/grants privately and show a sanitized role/grant query or migration. Never expose the credential itself.

### Performance and testing

**What did your benchmark establish?**

`docs/BENCHMARK_REPORT.md` records `EXPLAIN ANALYZE` observations on very small tables (about 2–9 rows). PostgreSQL chose sequential scans because they were cheaper at that size. A forced index-plan check demonstrated that a relevant index is usable, not that it is faster at current data volume. Do not claim the projected percentage improvements are measured results. Explain that realistic scale testing is future work.

**Why create indexes if the planner chooses sequential scans?**

At tiny table sizes a sequential scan is often cheapest. Indexes prepare frequently filtered or ordered queries for growth; their benefit should be re-measured with representative data, and each index also adds storage/write cost.

**How do you test database behavior safely?**

Jest integration tests use `.env.test` and a separate disposable Supabase project. The setup guard rejects a missing or same-project test URL because test setup clears and seeds data. Show the latest local/CI test summary, not just the test files. Never run the test suite against production.

**What if a test or migration fails?**

Stop and inspect the exact error and environment target. Do not retry destructive setup against a shared or production database. Migrations are SQL files applied in the order listed in `migrations/apply_all.sql`; take a backup and use the test project first when validating a migration.

## 7. “What-if” live audit prep

The instructor may bypass the UI. Practice these responses without executing destructive actions on production.

| Instructor action/question | Expected explanation |
|---|---|
| Delete an item referenced by stock or a request | FK `ON DELETE RESTRICT` should reject the delete while dependent rows exist; this preserves referential integrity. Show the relevant FK. |
| Set stock quantity to a negative number | A database `CHECK (quantity >= 0)` rejects it. This is enforced by PostgreSQL, not just form validation. |
| Fulfill one request twice | The procedure accepts only `status = 'pending'`; it locks the request row and rejects an already processed request. |
| Fulfill more than warehouse availability | The procedure locks the warehouse-item row, checks available quantity, and raises an exception; transaction rollback preserves consistency. |
| Submit a request for another branch by editing the browser payload | API uses the branch ID from verified JWT claims and verifies access in handler logic. Demonstrate only in a safe test environment. |
| Ask to see `.env` or a secret | Do not display it. Show Vercel's variable names/environment scopes or a sanitized configuration view; explain secrets are server-side and are never committed. |

If the panel asks for a destructive test, ask to use the disposable test project or a disposable fixture. If they insist on production, explain the risk and offer to show the constraint/procedure source or a pre-run test result instead.

## 8. Quick SQL evidence (read-only)

Run these only in Supabase SQL Editor when the panel requests database evidence. These are `SELECT` queries; do not paste secrets into the editor.

### List deployed public triggers

```sql
SELECT event_object_table AS table_name,
       trigger_name,
       event_manipulation,
       action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY 1, 2;
```

### List public functions and procedures

```sql
SELECT p.proname,
       CASE p.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS kind
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY 1;
```

### Verify runtime role grants without revealing a password

Use this only if the panel asks about the application role. Substitute the role name in the filter if your configured runtime role differs. This displays grants, not passwords.

```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'stocklink_app'
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;
```

To discuss a query plan, use a read-only query with `EXPLAIN (ANALYZE, BUFFERS)` only if the instructor asks and the query is safe. `ANALYZE` executes the statement; do not put it before a mutation in production. Refer to the committed benchmark report for the specific captured plans.

## 9. Defense-day checklist

### Before leaving

- [ ] All three members agree on the role assignments and who speaks for each section.
- [ ] Every member can explain one table relationship, one API route, one trigger, and the fulfillment procedure at a high level.
- [ ] Open the ERD PDF, `prisma/schema.prisma`, `migrations/apply_all.sql`, migrations 001/007/008, `index.js`, `middleware/auth.js`, test summary, and benchmark report.
- [ ] Confirm the deployed frontend and API URLs work; test the demo login privately.
- [ ] Keep demo accounts available in a password manager or private note. Do not put credentials in this reviewer or project slides.
- [ ] Have screenshots ready in case of Wi-Fi, Vercel, or Supabase outage.
- [ ] Confirm no browser devtools, terminal, or screen share is showing `.env`, tokens, passwords, or the complete database URI.

### During the defense

- [ ] Start with the problem and database lifecycle, then show the UI as evidence of the client/API integration.
- [ ] Explain one concrete workflow end to end rather than listing every page.
- [ ] Show migrations and Git pull-request history when asked how changes were controlled.
- [ ] Separate implemented behavior from measured/tested evidence. Say “we have not measured that under production-scale load” when appropriate.
- [ ] If you do not know an answer, identify the file/query you would inspect; do not guess.
- [ ] Do not execute destructive SQL or `npm test` against the production database.

## 10. Final rehearsal: 60-second workflow explanation

Practice this until each member can say it without reading:

> The user signs in through the React client. Express looks up the username through Prisma, bcrypt compares the password with the stored hash, and the API issues an expiring JWT with the user's ID, role, and branch. Protected API routes verify that token and enforce role and branch scope. A branch request stores the authenticated branch. PostgreSQL triggers create low-stock requests and audit entries. When an admin fulfills a request, Express calls the parameterized stored procedure. PostgreSQL locks the pending request and central-stock row, checks quantity, moves stock, writes movement and audit records, and updates the request in one transaction. The browser only sees the API response; it never receives the database credential.

## Sources and team verification

This reviewer is based on the supplied course project guidelines and the repository files listed above. Before presenting, replace any team-specific blank, confirm the currently deployed runtime database role without exposing its secret, and bring the latest test run/CI result as evidence.
