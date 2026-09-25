# Team Setup Guide - StockLink Inventory System

This guide will help you set up the project on your local machine so you can develop independently.

## Prerequisites

Before you start, make sure you have:
- **Node.js** (v18 or higher) and **npm** installed
- **Git** installed
- Access to the GitHub repository: `github.com/bayronearljames-source/stocklink-inventory-system`
- The shared **DATABASE_URL** connection string (ask your teammate for this - DO NOT commit it to Git)

## Setup Steps

### 1. Clone and Sync the Repository

```bash
git clone https://github.com/bayronearljames-source/stocklink-inventory-system.git
cd stocklink-inventory-system
git checkout main
git pull origin main
```

### 2. Set Up Backend Environment

Create a `.env` file in the **root directory**:

```bash
# In the root directory (not in client/)
touch .env
```

Add the following content (replace with the actual DATABASE_URL your teammate will send you):

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"
```

**⚠️ IMPORTANT:** Get the actual `DATABASE_URL` from your teammate via Slack/Discord DM. Never commit `.env` files to Git.

### 3. Install Backend Dependencies

```bash
# In the root directory
npm install
```

This will install Express, Prisma, CORS, and other backend dependencies.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your database schema. You'll need to run this whenever the schema changes.

### 5. Set Up Frontend Environment

Create a `.env` file in the **client/** directory:

```bash
cd client
touch .env
```

Add the following content:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api
```

### 6. Install Frontend Dependencies

```bash
# Make sure you're in the client/ directory
npm install
```

This installs React, Vite, Tailwind CSS, and other frontend dependencies.

### 7. Run Both Servers

You need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
# In the root directory
npm run dev
```

You should see:
```
Server running on http://localhost:3000
```

**Terminal 2 - Frontend Dev Server:**
```bash
# In the root directory (or you can cd client && npm run dev)
npm run client
```

You should see:
```
VITE v8.3.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 8. Verify It's Working

1. Open your browser to http://localhost:5173/
2. Open DevTools (F12) -> Network tab
3. The frontend should successfully fetch data from `http://localhost:3000/api/items`
4. No CORS errors should appear in the console

## Success Criteria ✅

- ✅ Backend running on http://localhost:3000
- ✅ Frontend running on http://localhost:5173
- ✅ Frontend can fetch data from your local backend (no CORS errors)
- ✅ You can start/stop both servers independently
- ✅ Changes to code auto-reload (nodemon for backend, Vite HMR for frontend)

## Troubleshooting

### "Cannot find module 'express'" or similar errors
- Run `npm install` in the root directory

### "Error: P1001: Can't reach database server"
- Check your `DATABASE_URL` in `.env` is correct
- Make sure you copied the full connection string including the password

### CORS errors in browser console
- Make sure you pulled the latest changes (`git pull origin main`)
- The backend should have `cors` installed and configured in `index.js`

### Frontend can't connect to backend
- Verify `client/.env` has `VITE_API_URL=http://localhost:3000/api`
- Restart the frontend dev server after changing `.env` files
- Check that both servers are actually running

### "prisma:error Prisma Client could not locate the Query Engine"
- Run `npx prisma generate` again

## Project Structure

```
stocklink-inventory-system/
├── .env                    # Backend environment (DATABASE_URL) - NOT committed
├── index.js                # Express server entry point
├── package.json            # Backend dependencies
├── prisma/
│   └── schema.prisma       # Database schema
├── client/
│   ├── .env                # Frontend environment (VITE_API_URL) - NOT committed
│   ├── package.json        # Frontend dependencies
│   └── src/                # React components
└── README.md
```

## Development Workflow

1. Pull latest changes: `git pull origin main`
2. If schema changed: `npx prisma generate`
3. Start both servers (Terminal 1: `npm run dev`, Terminal 2: `npm run client`)
4. Make your changes
5. Test in browser at http://localhost:5173/
6. Commit and push your changes

## Need Help?

If you get stuck:
1. Check this guide's Troubleshooting section
2. Make sure both `.env` files are set up correctly
3. Try deleting `node_modules` and running `npm install` again
4. Ask your teammate for help on Slack/Discord

---

**Remember:** Both of you connect to the **same Supabase database**, so changes one person makes will be visible to the other. Coordinate when making schema changes!
