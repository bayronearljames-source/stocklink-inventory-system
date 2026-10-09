# StockLink

StockLink is a multi-branch inventory and restocking system built for the Advanced Database Systems course project. It uses PostgreSQL triggers and a stored procedure to support low-stock detection, restock requests, stock movement logging, and audit history.

## Stack

- PostgreSQL (the team currently uses Supabase)
- Express.js, Prisma, and Node.js for the API
- React and Vite for the client
- Jest and Supertest for integration tests

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

Create a separate disposable test database, apply the schema and SQL routines to it, then create a root `.env.test` file containing its connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/stocklink_test"
```

The test helper requires `.env.test` and will fail fast if that file or `DATABASE_URL` is missing; it will not use the root `.env` as a fallback.

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

## Database and project files

- `migrations/001_init_schema.sql` defines the initial schema, triggers, and stored procedure.
- `migrations/` contains follow-up fixes and database changes; review these with the DBA before applying them.
- `prisma/schema.prisma` defines the Prisma client models.
- `index.js` and `routes/` contain the Express API.
- `client/src/` contains the React application.
- `tests/integration/` contains API and database integration tests.
- `SETUP_GUIDE.md` contains additional team setup notes.

## Troubleshooting

- **Prisma cannot reach the database:** check the relevant `.env` file, confirm the database is online and reachable from your network, and verify the connection string. Use `.env.test` only for the disposable test database.
- **Prisma model/client errors after schema changes:** run `npx prisma generate` from the repository root.
- **The client cannot reach the API:** confirm `npm run dev` is running, verify `client/.env` has the API URL above, and restart Vite after changing environment variables.
- **Browser CORS errors:** confirm the API is running at the URL in `VITE_API_URL` and inspect the API terminal for errors.
