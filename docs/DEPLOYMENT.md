# StockLink Deployment Guide

Complete guide for deploying the StockLink Inventory Management System to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ **Supabase database active** (unpause if needed)
- ✅ **Test accounts created** (testadmin, testmanager, testclerk)
- ✅ **All changes committed** to GitHub
- ✅ **Production-ready code** (no quick login, no demo switch)
- ✅ **Environment variables** documented

---

## 🗄️ Database Setup

### Your Supabase Database

**Database Host:** `YOUR-PROJECT.pooler.supabase.com:5432`  
**Project ID:** `YOUR-SUPABASE-PROJECT-ID`

> ⚠️ **Security Note:** Never commit real database credentials to Git. Use environment variables on your deployment platform.

### Keep Database Active

⚠️ **Important:** Supabase free tier pauses databases after inactivity. Before deployment:

1. Go to your Supabase dashboard: `https://supabase.com/dashboard/project/YOUR-PROJECT-ID`
2. Check database status
3. Click "Resume" if paused
4. Keep it active during deployment and testing

### User Accounts

Create production user accounts (or use test accounts):

```bash
# Admin account
node scripts/create-user.js admin1 YourSecurePassword123! admin

# Manager account (replace branch_id with actual branch)
node scripts/create-user.js manager1 YourSecurePassword123! manager 1

# Clerk account
node scripts/create-user.js clerk1 YourSecurePassword123! clerk 1
```

---

## 🚀 Deployment Options

Choose one platform based on your needs:

### Option 1: Vercel (Recommended for Full-Stack)

**Pros:**
- ✅ Easy GitHub integration
- ✅ Automatic deployments
- ✅ Free SSL certificates
- ✅ Good for React + Node.js apps

**Cons:**
- ⚠️ Serverless functions have 10-second timeout (hobby plan)

### Option 2: Render

**Pros:**
- ✅ Full backend support (no serverless limits)
- ✅ Free PostgreSQL hosting included
- ✅ Background workers support
- ✅ Good for traditional Node.js apps

**Cons:**
- ⚠️ Slower cold starts on free tier
- ⚠️ Free services spin down after 15 minutes inactivity

### Option 3: Railway

**Pros:**
- ✅ Full-stack deployment
- ✅ PostgreSQL included
- ✅ Simple configuration

**Cons:**
- ⚠️ Limited free tier ($5 credit)

---

## 📦 Deploying to Vercel

StockLink has a Vite frontend in `client/` and an Express API in the repository root. Deploy them as **two Vercel projects** connected to the same GitHub repository. Do not use a root `vercel.json` to build the frontend and API together.

### 1. Deploy the API project

1. In Vercel, choose **Add New → Project** and import `bayronearljames-source/stocklink-inventory-system`.
2. Set **Root Directory** to `.` (the repository root). Vercel detects the root `index.js` Express app; leave the Build Command and Output Directory at their detected defaults.
3. Before deploying, add these environment variables in **Settings → Environment Variables**:

   | Name | Production value | Preview value |
   | --- | --- | --- |
   | `DATABASE_URL` | Supabase Production **Transaction pooler** URI, with `pgbouncer=true` | Disposable test database Transaction pooler URI, with `pgbouncer=true` |
   | `JWT_SECRET` | A new, random secret stored only in Vercel | A separate random secret |
   | `NODE_ENV` | `production` | `production` |
   | `DB_ENVIRONMENT` | `production` | `test` |

   Get each database URI from the corresponding Supabase project's **Connect → Transaction pooler**. The URI uses port `6543`; preserve the username and host Supabase provides. URL-encode special characters in the password. For this Prisma 5 serverless app, add `pgbouncer=true&connection_limit=1` to the URI's query parameters.

   Generate a random JWT secret locally with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. Paste the output directly into Vercel; do not commit it or send it in chat.

4. Deploy the prep branch as a **Preview** deployment first. Check the deployment URL root; it should respond `StockLink API is running`.

### 2. Deploy the frontend project

1. In Vercel, add another project and import the same repository.
2. Set **Root Directory** to `client/`. Vercel should detect Vite. Use `npm run build` as the Build Command and `dist` as the Output Directory.
3. Add `VITE_API_URL` under Environment Variables:
   - **Preview:** `https://<API-preview-domain>/api`
   - **Production:** `https://<API-production-domain>/api`
4. Deploy the prep branch as a **Preview** deployment. Open the frontend preview and test login and read-only pages using test-database accounts. Avoid stock-changing actions against Production during preview testing.

### 3. Promote to Production

After both Preview deployments work with the disposable test database, open a pull request for the prep branch. Merge it only after review. Vercel then creates Production deployments from `main`; verify the API and frontend URLs and test login with a dedicated Production account.

Do not put database passwords, JWT secrets, or live account credentials in GitHub or this guide. Keep them in each Vercel project's Environment Variables.

---

## 🎨 Deploying to Render

### Step 1: Create Render Account

Go to: https://render.com/

### Step 2: Create Web Service (Backend)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `stocklink-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables:**
   ```
   DATABASE_URL = postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/postgres
   
   JWT_SECRET = YOUR_SECURE_JWT_SECRET_HERE
   
   NODE_ENV = production
   ```

5. Click **"Create Web Service"**
6. Copy your backend URL: `https://stocklink-backend.onrender.com`

### Step 3: Create Static Site (Frontend)

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   - **Name:** `stocklink-frontend`
   - **Build Command:** `cd client && npm install && npm run build`
   - **Publish Directory:** `client/dist`

4. **Add Environment Variable:**
   ```
   VITE_API_URL = https://stocklink-backend.onrender.com/api
   ```

5. Click **"Create Static Site"**
6. Get your live URL: `https://stocklink-frontend.onrender.com`

---

## 🚂 Deploying to Railway

### Step 1: Create Railway Account

Go to: https://railway.app/

### Step 2: Deploy from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `stocklink-inventory-system`
4. Railway auto-detects Node.js

### Step 3: Configure Environment

1. Click on your service
2. Go to **"Variables"** tab
3. Add:
   ```env
   DATABASE_URL=YOUR_PRIVATE_DATABASE_URL
   JWT_SECRET=YOUR_PRIVATE_RANDOM_SECRET
   NODE_ENV=production
   PORT=3000
   ```

4. Go to **"Settings"** → **"Networking"**
5. Click **"Generate Domain"**
6. Get your URL: `https://stocklink-inventory-system.up.railway.app`

### Step 4: Configure Frontend

Update `client/.env.production`:
```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
```

Commit and push - Railway auto-deploys!

---

## 🔐 Environment Variables Reference

### Backend (.env)

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/postgres"

# JWT Secret for authentication tokens (generate a secure random string)
JWT_SECRET="YOUR_SECURE_JWT_SECRET_HERE"

# Environment
NODE_ENV="production"
```

> 🔐 **Security Best Practices:**
> - Never commit `.env` files to Git (already in `.gitignore`)
> - Use strong, unique passwords for database access
> - Generate JWT secret with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
> - Keep credentials only in deployment platform environment variables

### Frontend (client/.env.production)

```env
# Backend API URL (update after deployment)
VITE_API_URL=https://YOUR-DEPLOYED-BACKEND-URL/api
```

---

## ✅ Post-Deployment Testing

### 1. Test Backend API

```bash
# Test health check
curl https://YOUR-DEPLOYED-URL/api/branches

# Should return 401 Unauthorized (expected - means auth is working)
```

### 2. Test Frontend

1. Open your deployed URL
2. Try logging in with test account:
   - Username: `testadmin`
   - Password: `Admin1234!`
3. Verify you can:
   - ✅ Log in successfully
   - ✅ See the admin dashboard
   - ✅ Navigate between pages
   - ✅ View items, branches, stock
   - ✅ Log out

### 3. Test All User Roles

Test with different accounts:

**Admin:**
- Username: `testadmin`
- Password: `Admin1234!`
- Should see: All features, all branches

**Manager:**
- Username: `testmanager`
- Password: `Admin1234!`
- Should see: Branch management, stock approvals

**Clerk:**
- Username: `testclerk`
- Password: `Admin1234!`
- Should see: Limited branch access, basic operations

---

## 🐛 Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
1. Check Supabase database is **not paused**
2. Verify `DATABASE_URL` environment variable is correct
3. Check database has internet access enabled

### Issue: "Login failed"

**Solution:**
1. Check backend is running: `https://YOUR-URL/api/branches`
2. Verify user accounts exist in database
3. Check JWT_SECRET is set
4. Check CORS settings allow frontend domain

### Issue: Frontend shows blank page

**Solution:**
1. Check browser console for errors
2. Verify `VITE_API_URL` points to correct backend
3. Ensure frontend build succeeded
4. Check static files are being served

### Issue: 401 Unauthorized on all requests

**Solution:**
1. Clear browser cache and cookies
2. Check JWT_SECRET matches between deployments
3. Try logging in again
4. Verify token is being sent in headers

---

## 📊 Production Credentials

### Test Accounts

Test accounts are for the disposable test database only. Do not use or publish these credentials for Production.



### Production Accounts (Actual Use)

Create secure production accounts:

```bash
node scripts/create-user.js <username> <secure-password> <role> [branch_id]
```

**Password Requirements:**
- At least 8 characters
- Include uppercase, lowercase, numbers
- Use unique passwords for each account

---

## 📝 Sharing with Your Professor

### Submission Format

Provide your professor with:

1. **Live URL:**
   ```
   https://your-deployed-app.vercel.app
   ```

2. **Test Credentials:**
   ```
   Admin Account:
   Username: testadmin
   Password: Admin1234!
   ```

3. **GitHub Repository:**
   ```
   https://github.com/bayronearljames-source/stocklink-inventory-system
   ```

4. **Documentation:**
   - Link to README.md
   - Link to this DEPLOYMENT.md
   - Link to project showcase: `docs/project-showcase.html`

### Email Template

```
Subject: StockLink Inventory System - Deployment Submission

Dear Professor,

I am submitting my completed StockLink Inventory Management System project.

Live Application: https://YOUR-DEPLOYED-URL
GitHub Repository: https://github.com/bayronearljames-source/stocklink-inventory-system

Test Account (Admin):
Username: testadmin
Password: Admin1234!

The system features:
- 11-table PostgreSQL database with triggers and stored procedures
- Role-based access control (Admin, Manager, Clerk)
- Real-time stock tracking and automated restock workflow
- Complete audit trail
- 25+ REST API endpoints
- Integration tests

Please let me know if you need any additional information.

Best regards,
Vincent Hinacay
```

---

## 🎯 Next Steps After Deployment

1. ✅ **Test thoroughly** - Try all features in production
2. ✅ **Monitor logs** - Watch for errors in deployment dashboard
3. ✅ **Document live URL** - Add to README.md
4. ✅ **Share with team** - Send deployment link to teammates
5. ✅ **Prepare demo** - Practice showing features for defense

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app/
- **Supabase Docs:** https://supabase.com/docs

---

**Deployment guide created:** 2026-10-24  
**Project:** StockLink Inventory Management System  
**Course:** IM101 - Advanced Database Systems
