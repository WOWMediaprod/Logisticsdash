# Logistics Platform

A comprehensive logistics management platform for container shipping, driver tracking, and job request management.

## 🏗️ Project Structure

```
logistics-platform/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router, React Server Components)
│   ├── api/          # NestJS backend (REST API + WebSockets)
│   └── mobile/       # React Native mobile app (TBD)
├── packages/
│   └── ui/           # Shared UI components
├── docs/             # Product requirements, API docs, designs
├── infra/            # Infrastructure as Code (Terraform)
└── .github/          # CI/CD workflows
```

## ✨ Features

### Core Functionality
- **Job Request Management**: Multi-step wizard form for clients to submit shipping requests
- **Driver Tracking**: Real-time GPS tracking with geofencing
- **Document Management**: Upload and OCR processing for shipping documents (Release Orders, Bills of Lading, etc.)
- **Waypoint Management**: Geofences with auto-status updates and ETA tracking
- **Real-time Notifications**: WebSocket-based updates for job status changes

### Recent Additions (Nov 2025)
- ✅ **Real-Time Client Job Portal**: Clients see all job updates instantly without manual refresh
  - Live GPS location tracking on map
  - Instant status change notifications
  - Amendment synchronization
  - Document upload notifications
  - Connection status indicator ("Live" badge)
  - Zero manual refresh required
- ✅ **Complete Job Amendment System**: Admins can now amend all aspects of jobs with intelligent status-based validation
  - Driver reassignment with smart restrictions
  - Job type amendment with transit-state protection
  - Admin status override capability
  - GPS tracking configuration (enable/disable, public links)
  - Organized 5-section amendment modal
  - Real-time WebSocket notifications
- ✅ **Route Model Removal**: Simplified job creation by removing redundant route selection
- ✅ **Waypoint-Based Navigation**: Waypoints now serve as primary system for geofencing and tracking
- ✅ **0 Hours Free Time Option**: Clients can specify zero free time for held up containers
- ✅ **Client Job Request Portal**: 5-step wizard with conditional fields
- ✅ **Split Contact Fields**: Separate name and phone inputs for better data quality
- ✅ **WhatsApp Image Upload**: Support for WhatsApp images with special character handling
- ✅ **Supabase Storage Integration**: Secure file storage with CDN delivery
- ✅ **Shipment Type Support**: Export, Import, LCL workflows

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API
- **State Management**: React Context + localStorage
- **Deployment**: Vercel

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Neon - Serverless Postgres)
- **ORM**: Prisma
- **File Storage**: Supabase Storage (S3-compatible)
- **Authentication**: JWT + Passport
- **Real-time**: Socket.io
- **OCR**: Tesseract.js
- **Deployment**: Render

## 📦 Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL database (or Neon account)
- Supabase account (for file storage)
- Google Maps API key

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/WOWMediaprod/Logisticsdash.git
cd logistics-platform
pnpm install
```

### 2. Backend Environment Variables

Create `apps/api/.env`:

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/database?sslmode=require"

# Application
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Supabase Storage
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_BUCKET=logistics-documents
```

### 3. Frontend Environment Variables

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Setup Supabase Storage

1. Go to https://supabase.com/dashboard
2. Create a new project or select existing
3. Navigate to **Storage** → **Create new bucket**
4. Bucket name: `logistics-documents`
5. Make it **private** (not public)
6. Add storage policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logistics-documents');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logistics-documents');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logistics-documents');
```

7. Get credentials from **Project Settings** → **API**:
   - Project URL → `SUPABASE_URL`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Setup Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

## 🏃 Running Locally

### Development Mode

```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- API Docs: http://localhost:3001/api

### Production Build

```bash
# Build all apps
pnpm build

# Run production
cd apps/api && pnpm start:prod
cd apps/web && pnpm start
```

## 🚢 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Build Command:
   ```bash
   cd apps/api && npm install --production=false && npx prisma generate && npx prisma db push --accept-data-loss && npm run build
   ```
4. Start Command:
   ```bash
   cd apps/api && node dist/main.js
   ```
5. Add environment variables (see Backend Environment Variables above)
6. Deploy!

### Frontend (Vercel)

1. Import repository to Vercel
2. Framework Preset: Next.js
3. Root Directory: `apps/web`
4. Build Command: (leave default) `next build`
5. Output Directory: (leave default) `.next`
6. Add environment variables (see Frontend Environment Variables above)
7. Deploy!

## 📱 Client Job Request Portal

The client portal allows customers to submit job requests through a multi-step wizard:

### Step 1: Basic Information
- Job Title (required)
- Priority Level (LOW, NORMAL, HIGH, URGENT)
- Shipment Type (EXPORT, IMPORT, LCL)
- Release Order Document Upload

### Step 2: Loading & Cargo
- Loading Location (Google Maps autocomplete)
- Loading Contact Name & Phone (required, split fields)
- Loading Date & Time
- Cargo Description & Weight

### Step 3: Container & BL Cutoff
- Container Reservation (optional)
  - Container Number
  - Seal Number
  - Container Yard Location
- BL Cutoff Date/Time (optional)

### Step 4: Wharf & Delivery
- Wharf Name & Contact
- Delivery Address (Google Maps autocomplete)
- Delivery Contact Name & Phone (required, split fields)
- Supporting Documents Upload (multiple files)
- Special Requirements/Notes

### Step 5: Review & Submit
- Review all information
- Edit any step if needed
- Submit for admin approval

## 🔒 File Upload Features

- **Supported Formats**: PDF, JPEG, JPG, PNG, TIFF
- **Max File Size**: 50MB per file
- **WhatsApp Images**: Automatic filename sanitization
- **OCR Processing**: Automatic text extraction from documents (optional)
- **Client Tracking**: Metadata tracks which client uploaded each file

## 📊 Database Schema Highlights

### Job Requests (`job_requests` table)
- Split contact fields: `loadingContactName`, `loadingContactPhone`, `deliveryContactName`, `deliveryContactPhone`
- Shipment type: `shipmentType` (EXPORT, IMPORT, LCL)
- Conditional fields: Container reservation, BL cutoff
- Document references: Links to uploaded files

### Documents (`documents` table)
- File storage: URL to Supabase Storage
- OCR data: Extracted text as JSON
- Metadata: Client information, upload source
- Foreign keys: Links to jobs and users (nullable for client uploads)

## 🐛 Troubleshooting

### Database Migration Issues

If you see "P3005 error" (database has no migration history):

```bash
# Use db push instead of migrate for existing databases
npx prisma db push --accept-data-loss
```

### File Upload Not Working

1. Check Supabase credentials in environment variables
2. Verify bucket name is `logistics-documents`
3. Check bucket policies allow authenticated uploads
4. Review Render logs for detailed error messages

### Frontend Not Connecting to API

1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Check CORS settings in NestJS (`main.ts`)
3. Ensure API is running and accessible

## 📖 Documentation

- **API Documentation**: http://localhost:3001/api (Swagger UI)
- **PRD Documents**: See `docs/prd/` folder
- **Database Schema**: See `apps/api/prisma/schema.prisma`

## 🤝 Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Test thoroughly (especially file uploads and database operations)
4. Create pull request with detailed description
5. Ensure CI/CD passes

## 📄 License

Private - All Rights Reserved

## 🙏 Acknowledgments

Built with:
- Next.js by Vercel
- NestJS
- Prisma
- Supabase
- Neon Database
- Google Maps Platform

---

**Last Updated**: November 19, 2025
**Version**: 2.1.0 - Job Amendment System Complete
