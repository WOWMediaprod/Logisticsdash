# Production Deployment Guide
**Stack**: Supabase (Database) + Railway (API) + Vercel (Frontend)

## 📋 Prerequisites

1. **Accounts Required**:
   - [Supabase Account](https://supabase.com) - Free tier
   - [Railway Account](https://railway.app) - Free $5 credit/month
   - [Vercel Account](https://vercel.com) - Free tier

2. **Tools Installed**:
   - Node.js 18+
   - pnpm
   - Git

## Part 1: Supabase Database Setup (15 minutes)

### Step 1.1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" → "New project"
3. Fill in:
   - **Name**: logistics-platform-prod
   - **Database Password**: (Generate strong password - SAVE THIS!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for project creation

### Step 1.2: Enable PostGIS Extension

1. In Supabase Dashboard, go to **Database** → **Extensions**
2. Search for "postgis" and click **Enable**
3. This enables location tracking features

### Step 1.3: Get Database Connection String

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password
5. **SAVE THIS** - you'll need it for Railway and local migration

### Step 1.4: Run Database Migrations

On your local machine:

```powershell
# 1. Update .env with Supabase connection string
cd "D:\Logistics App\logistics-platform\apps\api"

# 2. Create .env.production file
@"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
"@ | Set-Content -Path ".env.production"

# 3. Run Prisma migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 4. Generate Prisma client
npx prisma generate
```

### Step 1.5: Seed Initial Data (Optional)

```powershell
# Create a test company and admin user
npx prisma studio

# Or run seed script if you have one
npm run seed
```

---

## Part 2: Railway API Deployment (10 minutes)

### Step 2.1: Create Railway Project

1. Go to [https://railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub account if not already
4. Select your repository (or deploy from local - instructions below)

### Step 2.2: Configure Railway Service

1. Click **"Add Service"** → **"Empty Service"**
2. Name it: `logistics-api`

### Step 2.3: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Server
NODE_ENV=production
PORT=3004

# JWT Secrets
JWT_SECRET=<generate-random-64-char-string>
JWT_REFRESH_SECRET=<generate-random-64-char-string>

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyCin-hxK-rB7YsDBzTYMZdBI1vy4a8XEoU

# CORS
FRONTEND_URL=https://your-app.vercel.app
```

**To generate JWT secrets:**
```powershell
# Run in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### Step 2.4: Deploy API

**Option A: Deploy from GitHub**
1. Railway auto-deploys when you push to GitHub
2. It will detect NestJS and build automatically

**Option B: Deploy from Local (Railway CLI)**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
cd "D:\Logistics App\logistics-platform\apps\api"
railway up
```

### Step 2.5: Get Railway API URL

1. After deployment, go to **Settings** → **Domains**
2. Click **"Generate Domain"**
3. You'll get a URL like: `https://logistics-api-production.up.railway.app`
4. **SAVE THIS URL** - you'll need it for Vercel

### Step 2.6: Test API

```powershell
# Test health endpoint
curl https://your-api.up.railway.app/health

# Should return: {"status":"ok"}
```

---

## Part 3: Vercel Frontend Deployment (10 minutes)

### Step 3.1: Prepare Frontend for Deployment

Update environment variables for production:

```powershell
cd "D:\Logistics App\logistics-platform\apps\web"

# Create .env.production
@"
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
NEXT_PUBLIC_API_URL_HTTPS=https://your-api.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-api.up.railway.app
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCin-hxK-rB7YsDBzTYMZdBI1vy4a8XEoU
NEXT_PUBLIC_COMPANY_ID=your-test-company-id
"@ | Set-Content -Path ".env.production"
```

### Step 3.2: Deploy to Vercel

**Option A: Vercel Dashboard (Recommended)**

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
5. Add **Environment Variables** (same as .env.production above)
6. Click **"Deploy"**

**Option B: Vercel CLI**

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from web directory
cd "D:\Logistics App\logistics-platform\apps\web"
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: logistics-platform
# - Directory: ./
```

### Step 3.3: Get Vercel URL

After deployment:
- Vercel gives you a URL like: `https://logistics-platform.vercel.app`
- You can add custom domain later in **Settings** → **Domains**

### Step 3.4: Update Railway CORS

Go back to Railway → Variables and update:
```bash
FRONTEND_URL=https://logistics-platform.vercel.app
```

Then redeploy Railway service.

---

## Part 4: Testing Production Deployment

### Step 4.1: Access Admin Dashboard

1. Open: `https://logistics-platform.vercel.app/dashboard`
2. Login with your test admin user
3. Test creating a route, driver, vehicle, container

### Step 4.2: Access Client Portal

1. Open: `https://logistics-platform.vercel.app/client`
2. Login with test client user
3. Test job request submission

### Step 4.3: Access Driver App

1. Open on mobile: `https://logistics-platform.vercel.app/mobile-tracker`
2. Enter driver name
3. Test GPS tracking (should show "Connected" now!)

### Step 4.4: Verify WebSocket Connection

Open browser console on any page:
- Should see: `✅ Socket.IO connected`
- No more ngrok issues!

---

## Part 5: Production Configuration Checklist

### Security

- [ ] Change all default passwords
- [ ] Generate new JWT secrets
- [ ] Enable Supabase Row Level Security (RLS) if needed
- [ ] Set up CORS properly in NestJS
- [ ] Enable HTTPS only (automatic with Vercel/Railway)

### Performance

- [ ] Enable Vercel Edge Functions for faster response
- [ ] Set up Redis for caching (Railway Redis addon - $5/month)
- [ ] Configure CDN for static assets
- [ ] Enable Prisma query optimization

### Monitoring

- [ ] Set up Vercel Analytics (free)
- [ ] Set up Railway metrics monitoring
- [ ] Configure error tracking (Sentry integration)
- [ ] Set up uptime monitoring (UptimeRobot - free)

### Backup

- [ ] Enable Supabase automated backups (built-in)
- [ ] Export database weekly (manual backup)
- [ ] Version control all environment variables

---

## Environment Variables Reference

### Supabase (Database)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### Railway (API)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
NODE_ENV=production
PORT=3004
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
GOOGLE_MAPS_API_KEY=AIzaSyCin-hxK-rB7YsDBzTYMZdBI1vy4a8XEoU
FRONTEND_URL=https://logistics-platform.vercel.app
REDIS_URL=<optional-redis-url>
```

### Vercel (Frontend)
```bash
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
NEXT_PUBLIC_API_URL_HTTPS=https://your-api.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-api.up.railway.app
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCin-hxK-rB7YsDBzTYMZdBI1vy4a8XEoU
NEXT_PUBLIC_COMPANY_ID=your-company-id
```

---

## Troubleshooting

### Issue: Prisma Migration Fails

```bash
# Solution: Check connection string
npx prisma db pull --schema=./prisma/schema.prisma

# If fails, verify:
# 1. Password is correct
# 2. IP is whitelisted (Supabase allows all by default)
# 3. Database name is 'postgres'
```

### Issue: Railway Build Fails

```bash
# Check build logs in Railway dashboard
# Common fixes:
# 1. Add package.json "engines" field
# 2. Verify Node version compatibility
# 3. Check for missing dependencies
```

### Issue: Vercel Build Fails

```bash
# Check build logs
# Common fixes:
# 1. Ensure NEXT_PUBLIC_ prefix on client-side env vars
# 2. Check for TypeScript errors
# 3. Verify all imports resolve correctly
```

### Issue: WebSocket Disconnects

```bash
# Railway should support WebSockets by default
# If issues:
# 1. Check Railway service logs
# 2. Verify SOCKET_URL matches Railway domain
# 3. Ensure polling transport is enabled
```

### Issue: CORS Errors

```bash
# Update NestJS main.ts:
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## Cost Estimation (Free Tier)

- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Railway**: $5 credit/month (usually enough for API)
- **Vercel**: Free (100GB bandwidth, unlimited deployments)

**Total**: Free for development/demo, ~$5-10/month for production

---

## Next Steps After Deployment

1. **Custom Domain**: Add your domain to Vercel
2. **SSL Certificate**: Auto-managed by Vercel/Railway
3. **Database Backups**: Set up automated Supabase backups
4. **Monitoring**: Add Sentry for error tracking
5. **Analytics**: Enable Vercel Analytics
6. **Performance**: Add Redis caching via Railway addon

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

---

**Deployment Time**: ~35 minutes total
**Difficulty**: Intermediate
**Result**: Production-ready logistics platform with HTTPS and WebSocket support
