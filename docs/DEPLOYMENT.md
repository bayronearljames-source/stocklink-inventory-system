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
node scripts/create-user.js admin1 YOUR_SECURE_PASSWORD admin

# Manager account (replace branch_id with actual branch)
node scripts/create-user.js manager1 YOUR_SECURE_PASSWORD manager 1

# Clerk account
node scripts/create-user.js clerk1 YOUR_SECURE_PASSWORD clerk 1
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

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Prepare vercel.json

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3: Deploy via Vercel Dashboard

1. **Go to:** https://vercel.com/new
2. **Import from GitHub:**
   - Connect your GitHub account
   - Select: `bayronearljames-source/stocklink-inventory-system`
   - Branch: `main`

3. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/dist`

4. **Add Environment Variables:**

   Click "Environment Variables" and add:

   ```
   DATABASE_URL = <SET_PRIVATELY_IN_HOSTING_DASHBOARD>

   JWT_SECRET = YOUR_SECURE_JWT_SECRET_HERE

   NODE_ENV = production
   ```

   > 📝 Replace with your actual Supabase connection string and a secure JWT secret (use a password generator for the JWT secret)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get your live URL: `https://stocklink-inventory-system.vercel.app`

### Step 4: Update Frontend API URL

After deployment, update the frontend to use the production API:

1. In your Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add for the **client** build:
   ```
   VITE_API_URL = https://YOUR-VERCEL-URL.vercel.app/api
   ```
3. Redeploy from dashboard

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
   DATABASE_URL = <SET_PRIVATELY_IN_HOSTING_DASHBOARD>

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

   ```
   DATABASE_URL = postgresql://[Your Password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

   JWT_SECRET = <GENERATE_AND_SET_PRIVATELY>

   NODE_ENV = production

   PORT = 3000
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
DATABASE_URL=<SET_PRIVATELY_IN_HOSTING_DASHBOARD>

# JWT Secret for authentication tokens (generate a secure random string)
JWT_SECRET="YOUR_SECURE_JWT_SECRET_HERE"

# Environment
NODE_ENV="production"
```

> 🔐 **Security Best Practices:**
>
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

### Test Accounts (Development/Grading)

Use these for demonstration and grading:

```
Admin:
- Username: testadmin
- Password: Admin1234!

Manager:
- Username: testmanager
- Password: Admin1234!

Clerk:
- Username: testclerk
- Password: Admin1234!
```

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
