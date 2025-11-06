# Supabase Storage Setup Guide

This guide walks you through setting up Supabase Storage for the Logistics Platform.

## 📋 Prerequisites

- Supabase account (sign up at https://supabase.com)
- Backend environment access (Render dashboard or local development)

## 🚀 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `logistics-platform-prod` (or your preference)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., `ap-southeast-1` for Asia)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning

### 2. Create Storage Bucket

1. In your project dashboard, click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"** button
3. Configure bucket:
   - **Name**: `logistics-documents`
   - **Public bucket**: Toggle **OFF** (keep private for security)
   - **Allowed MIME types**: Leave empty (allow all)
   - **File size limit**: `52428800` (50MB in bytes)
4. Click **"Create bucket"**

### 3. Set Up Storage Policies

Storage policies control who can upload, read, and delete files.

#### Policy 1: Allow Uploads

1. Click on your `logistics-documents` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Fill in:
   - **Policy name**: `Allow upload to logistics-documents`
   - **Allowed operation**: Check ✅ **INSERT** only
   - **Target roles**: Select `authenticated` from dropdown
   - **Policy definition**:
     ```sql
     bucket_id = 'logistics-documents'
     ```
5. Click **"Review"** → **"Save policy"**

#### Policy 2: Allow Reading

1. Click **"New Policy"** again
2. Fill in:
   - **Policy name**: `Allow read from logistics-documents`
   - **Allowed operation**: Check ✅ **SELECT** only
   - **Target roles**: Select `authenticated`
   - **Policy definition**:
     ```sql
     bucket_id = 'logistics-documents'
     ```
3. Click **"Review"** → **"Save policy"**

#### Policy 3: Allow Deleting

1. Click **"New Policy"** again
2. Fill in:
   - **Policy name**: `Allow delete from logistics-documents`
   - **Allowed operation**: Check ✅ **DELETE** only
   - **Target roles**: Select `authenticated`
   - **Policy definition**:
     ```sql
     bucket_id = 'logistics-documents'
     ```
3. Click **"Review"** → **"Save policy"**

### 4. Get API Credentials

1. Click **"Project Settings"** (⚙️ gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. Copy these values:

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
👆 Copy this entire URL

#### Service Role Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
👆 Copy this long JWT token (starts with `eyJ`)

⚠️ **Important**: Use the **service_role** key (not the anon/public key) for server-side operations.

### 5. Configure Backend Environment Variables

#### For Local Development

Add to `apps/api/.env`:

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=logistics-documents
```

#### For Production (Render)

1. Go to https://dashboard.render.com
2. Select your **logistics-api** service
3. Click **"Environment"** tab
4. Add these environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJI...` (your service role key) |
| `SUPABASE_BUCKET` | `logistics-documents` |

5. Click **"Save Changes"**
6. Render will automatically redeploy

### 6. Test File Upload

#### From Local Development

1. Start the backend: `cd apps/api && pnpm dev`
2. Start the frontend: `cd apps/web && pnpm dev`
3. Go to: http://localhost:3000/client/request
4. Fill in the job request form
5. Upload a test image in Step 4 (Supporting Documents)
6. Submit the request

#### Verify in Supabase

1. Go to **Storage** → `logistics-documents` bucket
2. Navigate to: `companies/[companyId]/documents/SUPPORTING/[date]/`
3. You should see your uploaded file!

## 📂 File Storage Structure

Files are organized in this structure:

```
logistics-documents/
└── companies/
    └── [companyId]/
        ├── documents/
        │   ├── RELEASE_ORDER/
        │   │   └── 2025-11-06/
        │   │       └── uuid.jpg
        │   ├── SUPPORTING/
        │   │   └── 2025-11-06/
        │   │       └── uuid.pdf
        │   └── BILL_OF_LADING/
        │       └── 2025-11-06/
        │           └── uuid.pdf
        └── jobs/
            └── [jobId]/
                └── documents/
                    └── POD/
                        └── 2025-11-06/
                            └── uuid.jpg
```

## 🔒 Security Best Practices

### 1. Keep Service Role Key Secret
- ⚠️ Never commit service role key to git
- ✅ Always use environment variables
- ✅ Rotate keys if accidentally exposed

### 2. Use Row Level Security (RLS)
- Our policies ensure only authenticated users can access files
- Consider adding user-level policies if you need per-user access control

### 3. Validate File Types
- Backend validates MIME types: PDF, JPEG, PNG, TIFF
- Max file size: 50MB
- Consider adding virus scanning for production

### 4. Monitor Usage
- Check Supabase dashboard for storage usage
- Free tier: 1GB storage, 2GB bandwidth
- Paid plans: https://supabase.com/pricing

## 🐛 Troubleshooting

### Error: "The Access Key Id you provided does not exist"

**Cause**: Using service role key with S3-compatible API (doesn't work)

**Solution**: Our code now uses Supabase's native client (`@supabase/supabase-js`) instead of AWS SDK.

### Error: "New row violates row-level security policy"

**Cause**: Missing or incorrect storage policies

**Solution**:
1. Check policies exist for INSERT, SELECT, DELETE
2. Verify policy targets `authenticated` role
3. Check policy definition: `bucket_id = 'logistics-documents'`

### Files Not Appearing in Bucket

**Check these:**
1. ✅ Environment variables are set correctly
2. ✅ Bucket name matches exactly: `logistics-documents`
3. ✅ Service role key is valid (not anon key)
4. ✅ Check Render logs for upload errors

### Getting Public URLs

Files are private by default. To generate public/signed URLs:

```typescript
// In your code
const { data } = await supabase.storage
  .from('logistics-documents')
  .createSignedUrl('path/to/file.jpg', 3600); // expires in 1 hour

console.log(data.signedUrl); // Use this URL
```

## 📊 Storage Pricing

### Free Tier
- 1 GB storage
- 2 GB bandwidth per month
- Unlimited API requests

### Pro Plan ($25/month)
- 100 GB storage
- 200 GB bandwidth
- Everything in Free +
- Point-in-time recovery
- Automated backups

### Enterprise
- Custom storage
- Custom bandwidth
- Dedicated support
- SLA guarantees

See full pricing: https://supabase.com/pricing

## 🔄 Migration from AWS S3

If migrating from AWS S3:

1. Export data from S3 bucket
2. Upload to Supabase using their CLI or API
3. Update environment variables
4. Test thoroughly
5. Delete old S3 bucket (after confirming all files migrated)

## 📚 Additional Resources

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Storage API Reference**: https://supabase.com/docs/reference/javascript/storage
- **Security Best Practices**: https://supabase.com/docs/guides/storage/security

## ✅ Checklist

Before going to production, ensure:

- [ ] Supabase project created
- [ ] `logistics-documents` bucket created (private)
- [ ] All 3 storage policies added (INSERT, SELECT, DELETE)
- [ ] Environment variables set in Render
- [ ] Test file upload works
- [ ] Files appear in Supabase Storage
- [ ] Service role key is kept secret
- [ ] Monitoring set up for storage usage

---

**Questions?** Check the main README or create an issue on GitHub.

**Last Updated**: November 6, 2025
