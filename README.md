# StockLink Inventory Management System

StockLink is a comprehensive multi-branch inventory and restocking system built for the Advanced Database Systems course (IM101) finals project. It demonstrates advanced database concepts including PostgreSQL triggers, stored procedures, role-based access control, and comprehensive audit logging.

**Project Status:** ✅ Complete — All core features implemented, tested, and polished for finals defense.

## Technology Stack

### Backend
- **PostgreSQL** (hosted on Supabase) with custom triggers and stored procedures
- **Express.js** REST API with JWT authentication
- **Prisma ORM** for type-safe database access
- **Node.js 18+** runtime

### Frontend
- **React 18** with modern hooks and context
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive UI design
- **Lucide React** for icons

### Testing & Quality
- **Jest** for unit and integration testing
- **Supertest** for API endpoint testing
- **25+ integration tests** covering critical workflows
- **ESLint** for code quality

## Requirements

- Node.js 18 or later and npm
- Git
- A PostgreSQL database with the project schema and SQL routines applied
- A separate, disposable PostgreSQL database for integration tests

## Setup

1. Clone the repository and install the backend dependencies:

   ```sh
   git clone https://github.com/bayronearljames-source/stocklink-inventory-system.git
   cd stocklink-inventory-system
   npm install
   npx prisma generate
   ```

2. Create a root `.env` file based on `.env.example`. Set `DATABASE_URL` to the application database and replace the placeholder `JWT_SECRET` with a private random value.

3. Have the project DBA apply the SQL files in `migrations/` to the target database in the documented migration order. Confirm the schema, triggers, and stored procedures are present before starting the app. Do not point the application at a database you do not have permission to modify.

4. Install client dependencies:

   ```sh
   cd client
   npm install
   ```

5. Create `client/.env` with the local API URL:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

## Run locally

Start the API from the repository root:

```sh
npm run dev
```

In a second terminal, start the Vite client:

```sh
npm run client
```

The API is available at `http://localhost:3000` and the client at `http://localhost:5173`. The API health route is `/`.

## Login and credentials

The application uses database-backed user accounts with `admin`, `branch_manager`, and `clerk` roles. Ask the project team for the approved demo account details, or have an administrator provision an account in the intended database. The development utility scripts in `scripts/` can inspect or create users; use them only with a development database and never commit passwords or send them in source control.

Keep `.env`, `client/.env`, and `.env.test` private. They are ignored by Git. Never put real database URLs, JWT secrets, or account passwords in this README, screenshots, commits, or shared logs. Use a restricted database role for the application connection rather than a database owner or administrator account.

## Tests

The Jest integration tests modify database contents: their setup deletes rows from the application tables and creates test fixtures. **Never run them against production, a shared demo database, or any database containing data you need to keep.**

Create a separate disposable test project, apply the schema and SQL routines to it, then create `.env.test` from the safe template:

```sh
cp .env.test.example .env.test
```

Replace the placeholders with the separate test project's connection string. Keep `DB_ENVIRONMENT=test`. The `pretest` check requires both `.env` and `.env.test`, checks that the test project differs from the app project, and never prints either connection string. Integration test setup repeats the check before creating its Prisma client. If `.env.test` is missing or points to the same Supabase project as `.env`, tests stop before connecting.

The backend prints a sanitized database environment label and project target on startup. Set `DB_ENVIRONMENT` in your local `.env` (for example, `development` or `production`) and verify the target shown in the backend terminal before using write actions. The label does not change the database connection.

Run the full suite:

```sh
npm test -- --runInBand
```

Other available commands:

```sh
npm run test:integration
npm run test:coverage
npm run test:watch
```

## Key Features

### Database Architecture (11 Tables)
- ✅ **Normalized schema** with proper foreign keys and constraints
- ✅ **Automated triggers** for low-stock detection and audit logging
- ✅ **Stored procedure** for atomic restock fulfillment
- ✅ **19 performance indexes** for optimized queries
- ✅ **Composite primary keys** for junction tables

### Role-Based Access Control
- **Admin** — Full system access, user management, all branches
- **Branch Manager** — Branch-specific inventory and restock approval
- **Clerk** — Stock movements and sales logging

### Core Functionality
- ✅ Item catalog management with categories and pricing
- ✅ Multi-branch stock tracking with reorder thresholds
- ✅ Central warehouse inventory management
- ✅ Automated restock request workflow
- ✅ Stock movement logging (sales, withdrawals, adjustments)
- ✅ Supplier management with item linking
- ✅ Comprehensive audit trails
- ✅ Reports & analytics dashboard

### UI Polish
- ✅ Toast notifications for all actions
- ✅ Confirmation dialogs for destructive operations
- ✅ Loading states with spinners
- ✅ Responsive design (desktop and mobile)
- ✅ Theme-aware components

## Project Structure

- `migrations/` — Database schema, triggers, and stored procedures (5 migration files)
- `prisma/schema.prisma` — Prisma ORM schema definition
- `index.js` — Express server entry point
- `routes/` — API route handlers organized by resource
- `middleware/` — Authentication and authorization middleware
- `client/src/` — React frontend application
  - `pages/` — Main application pages by role
  - `components/common/` — Reusable UI components
  - `context/` — React context for auth and state
  - `api/` — API client configuration
- `tests/integration/` — Integration test suites (5 test files)
- `stocklink-dashboard.html` — Project dashboard for finals presentation
- `SETUP_GUIDE.md` — Team setup and development guidelines

## Finals Presentation

Open `stocklink-dashboard.html` in your browser for a comprehensive project overview dashboard showcasing:
- Phase completion status
- Key features and technical highlights
- Database architecture details
- Technology stack overview

## Troubleshooting

- **Prisma cannot reach the database:** check the relevant `.env` file, confirm the database is online and reachable from your network, and verify the connection string. Use `.env.test` only for the disposable test database.
- **Prisma model/client errors after schema changes:** run `npx prisma generate` from the repository root.
- **The client cannot reach the API:** confirm `npm run dev` is running, verify `client/.env` has the API URL above, and restart Vite after changing environment variables.
- **Browser CORS errors:** confirm the API is running at the URL in `VITE_API_URL` and inspect the API terminal for errors.

## Team

- **Repository:** [github.com/bayronearljames-source/stocklink-inventory-system](https://github.com/bayronearljames-source/stocklink-inventory-system)
- **Course:** IM101 — Advanced Database Systems
- **Status:** Week 7 of 8-Week Finals Block
