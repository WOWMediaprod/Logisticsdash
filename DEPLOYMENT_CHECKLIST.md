# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment (5 min)

- [ ] Create Supabase account at https://supabase.com
- [ ] Create Railway account at https://railway.app
- [ ] Create Vercel account at https://vercel.com
- [ ] Have your Google Maps API key ready
- [ ] Commit all code to Git repository (optional for Railway/Vercel GitHub deploy)

---

## 📦 Part 1: Supabase Database (15 min)

- [ ] Create new Supabase project
- [ ] Enable PostGIS extension
- [ ] Copy database connection string
- [ ] Save password securely
- [ ] Run migrations locally: `npx prisma migrate deploy`
- [ ] Verify tables created in Supabase dashboard

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

---

## 🚂 Part 2: Railway API (10 min)

- [ ] Create new Railway project
- [ ] Add empty service named "logistics-api"
- [ ] Set environment variables:
  - `DATABASE_URL` (from Supabase)
  - `NODE_ENV=production`
  - `PORT=3004`
  - `JWT_SECRET` (generate random 64 chars)
  - `JWT_REFRESH_SECRET` (generate random 64 chars)
  - `GOOGLE_MAPS_API_KEY`
  - `FRONTEND_URL` (will update after Vercel)
- [ ] Deploy from GitHub OR use Railway CLI
- [ ] Generate Railway domain
- [ ] Copy Railway API URL
- [ ] Test: `curl https://your-api.up.railway.app/health`

**Railway API URL:**
```
https://logistics-api-production.up.railway.app
```

---

## ▲ Part 3: Vercel Frontend (10 min)

- [ ] Import project from Git in Vercel dashboard
- [ ] Set root directory to `apps/web`
- [ ] Set environment variables:
  - `NEXT_PUBLIC_API_URL` (Railway URL)
  - `NEXT_PUBLIC_API_URL_HTTPS` (Railway URL)
  - `NEXT_PUBLIC_SOCKET_URL` (Railway URL)
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_COMPANY_ID` (your test company ID)
- [ ] Deploy
- [ ] Copy Vercel URL
- [ ] Go back to Railway → Update `FRONTEND_URL` → Redeploy

**Vercel URL:**
```
https://logistics-platform.vercel.app
```

---

## 🧪 Part 4: Testing (10 min)

### Admin Dashboard
- [ ] Open `https://your-app.vercel.app/dashboard`
- [ ] Login with admin account
- [ ] Create a route
- [ ] Create a driver
- [ ] Create a vehicle
- [ ] Create a container
- [ ] Create and assign a job

### Client Portal
- [ ] Open `https://your-app.vercel.app/client`
- [ ] Login with client account
- [ ] Submit a job request
- [ ] View assigned jobs
- [ ] Check job detail page with GPS map

### Driver Mobile
- [ ] Open on phone: `https://your-app.vercel.app/mobile-tracker`
- [ ] Enter driver name
- [ ] Check connection status (should show "Connected" ✅)
- [ ] Start tracking
- [ ] Verify location appears on admin dashboard

### WebSocket Check
- [ ] Open browser console
- [ ] Should see: `✅ Socket.IO connected`
- [ ] No disconnection errors

---

## 🔒 Security Checklist

- [ ] All JWT secrets are random and secure
- [ ] Database password is strong
- [ ] CORS configured correctly (Frontend URL in Railway)
- [ ] No sensitive data in Git repository
- [ ] `.env.local` is gitignored
- [ ] All production env vars set correctly

---

## 📊 Monitoring Setup (Optional)

- [ ] Enable Vercel Analytics
- [ ] Set up Railway metrics
- [ ] Configure Sentry for error tracking
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Enable Supabase automated backups

---

## 🎯 Success Criteria

✅ **All green if:**
- Admin dashboard loads and functions
- Client portal loads and shows jobs
- Driver tracker connects and sends location
- WebSocket shows "Connected" status
- No CORS errors in console
- GPS map loads on all pages
- Mobile tracker works on phone

---

## 🆘 Common Issues & Quick Fixes

### Issue: "Cannot connect to database"
**Fix:** Check DATABASE_URL is correct in Railway variables

### Issue: "CORS error"
**Fix:** Verify FRONTEND_URL matches Vercel URL exactly

### Issue: "WebSocket disconnected"
**Fix:** Ensure SOCKET_URL points to Railway domain (not localhost)

### Issue: "Map not loading"
**Fix:** Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in Vercel

### Issue: "Build fails on Vercel"
**Fix:** Check build logs, ensure all env vars have NEXT_PUBLIC_ prefix

---

## 📞 Need Help?

- **Supabase**: https://supabase.com/docs
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **Project Docs**: See `DEPLOYMENT.md` for detailed guide

---

**Total Time**: ~35-45 minutes
**Cost**: Free tier (Supabase + Vercel) + $5/month (Railway credit)
**Difficulty**: ⭐⭐⭐ Intermediate

---

## 📝 URLs Reference Sheet

Fill in as you go:

```
Supabase Project:     https://app.supabase.com/project/___________
Database Connection:  postgresql://postgres:[PASSWORD]@db.________.supabase.co:5432/postgres

Railway Dashboard:    https://railway.app/project/___________
Railway API URL:      https://logistics-api-production-________.up.railway.app

Vercel Dashboard:     https://vercel.com/your-username/___________
Vercel Frontend URL:  https://logistics-platform-________.vercel.app

Admin Dashboard:      https://logistics-platform-________.vercel.app/dashboard
Client Portal:        https://logistics-platform-________.vercel.app/client
Driver Tracker:       https://logistics-platform-________.vercel.app/mobile-tracker
```

---

**Ready to deploy? Start with Part 1: Supabase Database! 🚀**
