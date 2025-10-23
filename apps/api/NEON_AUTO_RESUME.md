# Neon Database Auto-Resume Setup

This document explains how the automatic database wake-up works for Neon's suspended databases.

## ✅ What's Already Set Up

### 1. **Automatic Retry Logic** (apps/api/src/database/prisma.service.ts)
The PrismaService automatically handles Neon wake-ups:
- Retries connection up to 5 times with exponential backoff
- First retry waits 3 seconds (enough time for Neon to wake up)
- Detects Neon-specific suspension errors
- Runs warmup query on successful connection

**Result:** Your app will automatically wake up and connect to Neon on startup, even if the database is suspended.

### 2. **Health Check Endpoint** (GET /health)
The `/health` endpoint now pings the database on every request:
- Endpoint: `https://logistics-api-d93v.onrender.com/api/v1/health`
- Returns database status
- Keeps database active when called regularly

**Example response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "version": "1.0.0-S0",
  "database": "connected"
}
```

### 3. **Deployment Warmup Script** (apps/api/scripts/db-warmup.js)
Optional script to wake up database before Render deployment.

## 🎯 Usage Options

### Option A: Let It Auto-Resume (Recommended for Free Tier)
**Do nothing!** The retry logic handles it automatically.

**Pros:**
- Zero configuration needed
- Works automatically
- No additional services required

**Cons:**
- First request after suspension may take 3-5 seconds
- Database suspends after ~5 minutes of inactivity

### Option B: Keep Database Always Active (Costs Money)
Use Render's Cron Jobs to ping your health endpoint every 4 minutes.

**Steps:**
1. Go to Render Dashboard
2. Create a new **Cron Job**
3. Configure:
   - **Name:** Keep Neon Active
   - **Command:** `curl https://logistics-api-d93v.onrender.com/api/v1/health`
   - **Schedule:** `*/4 * * * *` (every 4 minutes)

**Pros:**
- Database stays always active
- Instant response times
- No wake-up delays

**Cons:**
- Uses more compute time on Neon (may hit free tier limits)
- Requires Render paid plan for cron jobs

### Option C: Use Warmup Script on Deployment
Add to Render's **Build Command**:

```bash
node scripts/db-warmup.js && npm run build
```

**Pros:**
- Ensures database is active before deployment
- Prevents errors during deployment
- One-time wake-up

**Cons:**
- Only helps at deployment time
- Database can still suspend between deployments

## 🔍 Alternative: Free Cron Services

If you want to keep the database active without paying for Render cron:

**Option 1: UptimeRobot** (Free)
- Visit: https://uptimerobot.com
- Add monitor for: `https://logistics-api-d93v.onrender.com/api/v1/health`
- Set interval: 5 minutes (free tier)

**Option 2: Cron-job.org** (Free)
- Visit: https://cron-job.org
- Create job to ping: `https://logistics-api-d93v.onrender.com/api/v1/health`
- Set interval: 4 minutes

**Option 3: GitHub Actions** (Free)
Create `.github/workflows/keep-db-active.yml`:

```yaml
name: Keep Database Active

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping API Health Endpoint
        run: curl https://logistics-api-d93v.onrender.com/api/v1/health
```

## 📊 Recommendation

**For Production (Current Setup):**
Use **Option A** (Auto-Resume) + monitor with UptimeRobot for free uptime monitoring.

**Why:**
- Neon free tier gives 20 hours of compute per month
- Auto-suspend saves your compute hours
- Auto-resume happens in ~3-5 seconds
- Most production apps can handle the initial delay
- Upgrading to Neon's paid plan ($19/month) gives always-on database

## 🚀 Testing Auto-Resume

Test the auto-resume functionality:

```bash
# 1. Wait for database to suspend (5 minutes of inactivity)
# 2. Make a request to your API
curl https://logistics-api-d93v.onrender.com/api/v1/health

# You should see logs in Render showing:
# 🔄 Database is waking up from suspension (attempt 1/5)...
# ⏳ Retrying in 3000ms...
# ✅ Database connected successfully
# ✅ Database warmup complete
```

## 📝 Summary

Your Neon database will now:
1. ✅ Auto-wake when your app starts (even if suspended)
2. ✅ Show helpful logs during wake-up process
3. ✅ Provide database status via `/health` endpoint
4. ✅ Handle connection timeouts gracefully

No additional configuration needed for basic functionality!
