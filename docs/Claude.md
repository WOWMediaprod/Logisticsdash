# Claude.md - Logistics Platform Build Guide

## PROJECT OVERVIEW
Building a production-ready logistics platform for container hires with Trip Pack QR, real-time tracking, Economic IQ, and tenant-scoped RAG AI.

**Current Status**: ✅ **Phase 02 Complete** - Full job management system with client/admin/driver portals operational
**Latest Update**: 🚀 **Resource Management System** - Complete CRUD APIs for routes, drivers, vehicles, containers
**Next Phase**: Production Deployment & Mobile Tracker Testing

**Tech Stack:**
- Frontend: Next.js 15.5.3 (App Router), TypeScript, React 18.3.1, Tailwind CSS, Framer Motion
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL + PostGIS + pgvector, Socket.io
- Infrastructure: Docker, Redis, S3 (or local minio for dev), ngrok for mobile testing
- Maps: Google Maps JavaScript API with custom markers and real-time updates

## CRITICAL RULES - MUST FOLLOW

### 1. CODE STABILITY RULES
- **NEVER** modify existing working functions without explicit version management
- **ALWAYS** create new versions of functions rather than editing stable ones (e.g., `calculateJobEconomicsV2`)
- **NEVER** delete or rename database columns - only add new ones or create migration scripts
- **ALWAYS** use feature flags for new functionality that might affect existing features
- **NEVER** commit directly to main branch - use feature branches

### 2. DATABASE RULES (PostgreSQL)
- **ALWAYS** use migrations for schema changes - never modify schema directly in production
- **ALWAYS** use transactions for multi-table operations
- **ALWAYS** add indexes for foreign keys and frequently queried columns
- **NEVER** store sensitive data unencrypted
- **ALWAYS** use parameterized queries to prevent SQL injection

### 3. ARCHITECTURE RULES
- **NO BAND-AIDS**: Every solution must be production-ready from the start
- **ALWAYS** implement proper error handling, logging, and monitoring
- **ALWAYS** write tests for critical business logic
- **NEVER** hardcode configuration - use environment variables
- **ALWAYS** validate all inputs with Zod schemas
- **ALWAYS** implement idempotency for critical operations

### 4. MULTI-TENANCY RULES
- **EVERY** query must filter by `companyId`
- **NEVER** expose data across tenant boundaries
- **ALWAYS** validate tenant context in middleware
- **ALWAYS** include `companyId` in all database tables

## DIRECTORY STRUCTURE

```
logistics-platform/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # Reusable components
│   │   │   │   ├── ui/        # Base UI components
│   │   │   │   ├── features/  # Feature-specific components
│   │   │   │   └── layouts/   # Layout components
│   │   │   ├── lib/           # Utilities, hooks, constants
│   │   │   ├── services/      # API client services
│   │   │   └── types/         # TypeScript types
│   │   └── public/
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/
│       │   │   ├── jobs/
│       │   │   ├── documents/
│       │   │   ├── economics/
│       │   │   ├── maintenance/
│       │   │   └── rag/
│       │   ├── common/         # Shared utilities
│       │   ├── database/       # Database config & migrations
│       │   └── config/         # Configuration
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
├── packages/
│   ├── shared/                 # Shared types & utilities
│   └── database/               # Database schemas & types
├── docker/
│   ├── docker-compose.yml
│   └── postgres/
│       └── init.sql           # Extension setup
├── scripts/
│   ├── setup-dev.ps1          # Windows setup script
│   └── seed-data.ts
└── docs/
    ├── Claude.md              # This file
    ├── CHANGELOG.md
    └── API.md
```

## DEVELOPMENT PHASES

### 🎉 Phase 01: Live Driver Tracking (COMPLETED)
**Status**: ✅ **Successfully Completed** - Client satisfied with deliverables
**Achievement**: End-to-end mobile location tracking with dashboard integration

**Key Deliverables:**
- **Mobile Tracker**: Phone-optimized location tracking interface with iOS Safari support
- **Dashboard Integration**: Real-time Google Maps with live driver markers and status indicators
- **Robust Connection**: Hybrid WebSocket + HTTP fallback for maximum reliability
- **Production Ready**: ngrok HTTPS tunneling workflow for mobile deployment
- **Google Maps Fixed**: Enhanced CSP middleware resolving all map loading issues

**Critical Architecture Solutions:**
- **File**: `/apps/web/src/app/api/location/route.ts` - HTTP endpoint for location updates
- **File**: `/apps/web/src/app/track/page.tsx` - Smart fallback logic (WebSocket → HTTP)
- **File**: `/apps/web/src/contexts/SocketContext.tsx` - Hybrid connection strategy
- **Pattern**: Hybrid location sync via ngrok for iOS compatibility

**Technical Stack Validated:**
- Frontend: Next.js 15.5.3 with React 18.3.1, TypeScript, Tailwind CSS
- Backend: NestJS with Socket.io WebSocket gateway, PostgreSQL + Prisma
- Maps: Google Maps JavaScript API with custom markers and real-time updates
- Mobile: Browser Geolocation API with HTTPS location permission support

### 🚀 Phase 02: Job Request & Management Portal System (COMPLETED CORE)
**Status**: ✅ **Core Implementation Complete** - System integration and database workflow pending review
**Achievement**: Full-featured job request portal system with client/admin/driver interfaces

#### ✅ **Completed Deliverables:**

**1. Complete Database Schema Migration**
- ✅ **Phase 02 Migration**: `20250922_phase_02_job_request_portal/migration.sql`
- ✅ **New Models**: JobRequest, JobRequestUpdate, JobRequestDocument, JobUpdate, Notification
- ✅ **Enhanced Relations**: Company model updated with Phase 02 relationships
- ✅ **Schema Evolution**: Backwards-compatible extension of Phase 01 foundation

**2. Client Portal System (`/client`)**
- ✅ **Authentication Interface**: Login portal with company-scoped access
- ✅ **Multi-Step Request Form**: 4-step job request workflow (Basic → Route → Requirements → Documents)
- ✅ **Request Dashboard**: View submitted requests with status tracking
- ✅ **Document Upload**: Client-side file attachment system
- ✅ **Request Tracking**: Real-time status updates from pending to completed
- ✅ **Document Access**: View company documents and job-specific files

**3. Enhanced Admin Dashboard**
- ✅ **Request Management**: `/dashboard/requests` with comprehensive request review interface
- ✅ **Document Upload System**: Admin can upload documents for drivers/clients with role-based visibility
- ✅ **Document Categories**: Structured categorization (driver-instructions, permits, route-maps, safety, etc.)
- ✅ **Request Workflow**: Accept/decline requests with status transitions
- ✅ **Job Conversion**: Convert approved requests to active jobs
- ✅ **Real-time Updates**: Live status synchronization across portal

**4. Driver WebApp System (`/driver`)**
- ✅ **Simplified Portal Interface**: Clean dashboard with monthly stats and job lists
- ✅ **Current Job Panel**: Prominent display of active assignment with key details
- ✅ **Job Completion Workflow**: Step-by-step status progression (ASSIGNED → IN_TRANSIT → COMPLETED)
- ✅ **Automatic Location Tracking**: Background GPS tracking without manual controls
- ✅ **Document Access**: Driver-specific document portal with acknowledgment system
- ✅ **Mobile Optimization**: Touch-friendly interface optimized for phone use
- ✅ **Navigation Integration**: Google Maps integration for route guidance

#### ✅ **Technical Architecture:**

**Database Implementation:**
- **Files Modified**: `schema.prisma`, migration SQL, enhanced Company relations
- **Migration Strategy**: Non-breaking extension with proper foreign key constraints
- **Data Integrity**: Comprehensive indexes and relationship validation

**Frontend Architecture:**
- **Client Portal**: Multi-step forms with validation, document upload, request tracking
- **Admin Dashboard**: Enhanced with document management and request workflows
- **Driver Interface**: Simplified, mobile-first design with automatic tracking

**API Integration:**
- **Backend URLs**: Configurable HTTPS endpoints for ngrok compatibility
- **Error Handling**: Comprehensive fallback strategies and logging
- **Real-time Sync**: WebSocket foundation ready for live updates

#### ✅ **UX/UI Achievements:**

**Design Consistency:**
- Maintained dashboard theme across all interfaces
- Mobile-first responsive design for driver webapp
- Consistent color schemes and component styling

**User Experience:**
- **Client**: Intuitive request submission with clear status tracking
- **Admin**: Efficient request management with bulk operations
- **Driver**: Simple, distraction-free job execution interface

**Mobile Optimization:**
- Driver interface optimized for touch interaction
- Battery and signal indicators for mobile context
- Automatic location permissions and tracking

#### 🔧 **Technical Issues Resolved:**

**1. BOM Character Encoding**
- ✅ **Issue**: Compilation errors due to Byte Order Mark in driver files
- ✅ **Solution**: File re-encoding and proper UTF-8 handling
- ✅ **Result**: Clean compilation across all platforms

**2. React Hydration Mismatch**
- ✅ **Issue**: Server/client rendering inconsistency with time display
- ✅ **Solution**: Client-only time initialization and conditional rendering
- ✅ **Result**: Eliminated hydration errors on mobile browsers

**3. Job Data Integration**
- ✅ **Issue**: Mock data conflicts with real database jobs
- ✅ **Solution**: Dynamic API integration with fallback handling
- ✅ **Result**: Driver portal loads real jobs from database

**4. Database Connection Workflow**
- ✅ **Issue**: Migration execution during Docker startup timing
- ✅ **Solution**: Manual migration resolution and proper connection sequencing
- ✅ **Result**: Stable database connectivity and schema consistency

#### 📊 **System Integration Status:**

**Core Workflow Complete:**
✅ **Client Request → Admin Review → Driver Assignment → Job Execution → Status Updates**

**Ready for Production:**
- All interfaces functional and tested via ngrok mobile testing
- Database schema properly migrated and validated
- Error handling and fallback strategies implemented
- Mobile optimization verified on iOS Safari

#### 🔄 **Phase 02 Development Summary:**

**Timeline**: Rapid development cycle with iterative testing
**Quality**: Production-ready code with comprehensive error handling
**Scope**: Complete job lifecycle management system
**Testing**: Mobile ngrok testing for real-world validation

**Key Files Delivered:**
- `/apps/web/src/app/client/` - Complete client portal system
- `/apps/web/src/app/dashboard/requests/` - Enhanced admin interface
- `/apps/web/src/app/driver/` - Simplified driver webapp
- `/apps/api/prisma/migrations/20250922_phase_02_job_request_portal/` - Database migration
- **Enhanced**: Dashboard job management and document upload systems

#### 📋 **Next Steps (Pending User Direction):**
- Database workflow optimization per user requirements
- Production deployment configuration
- Advanced notification system implementation
- Real-time WebSocket enhancement across all interfaces

**Phase 02 Achievement**: Successfully extended Phase 01 foundation with comprehensive job management system while maintaining code quality and production readiness standards.

### 🔧 Phase 2.5: Resource Management System (COMPLETED)
**Status**: ✅ **Resource CRUD APIs Complete** - Full backend implementation with client-side integration
**Date**: 2025-10-17
**Achievement**: Complete CRUD operations for all logistics resources with multi-tenant filtering

#### ✅ **Completed Deliverables:**

**1. Routes Management System**
- **Service**: `apps/api/src/modules/routes/routes.service.ts` - Complete CRUD with multi-tenant filtering
- **DTOs**: `create-route.dto.ts`, `update-route.dto.ts` with class-validator
- **Controller**: POST, PATCH, DELETE endpoints added
- **Module**: RoutesService registered as provider
- **Key Feature**: General routes (clientId = null) visible to ALL clients within company
- **OR Query Pattern**: Returns both client-specific AND general routes:
  ```typescript
  where: {
    companyId,
    OR: [
      { clientId: clientId },
      { clientId: null }
    ]
  }
  ```

**2. Drivers Management System**
- **Service**: `apps/api/src/modules/drivers/drivers.service.ts` - Company-scoped CRUD
- **DTOs**: Driver profile validation (name, licenseNo, phone, email)
- **Controller**: Complete REST endpoints
- **Module**: DriversService provider registered
- **Integration**: Drivers now appear in client job request forms

**3. Vehicles Management System**
- **Service**: `apps/api/src/modules/vehicles/vehicles.service.ts` - Fleet management
- **DTOs**: Comprehensive vehicle data (regNo, class, make, model, year, kmpl, lease rates, maintenance)
- **Controller**: Full CRUD operations
- **Module**: VehiclesService provider registered
- **Economic Tracking**: Supports kmpl, leasePerDay, maintPerKm for cost analysis

**4. Containers Management System**
- **Service**: `apps/api/src/modules/containers/containers.service.ts` - Container tracking
- **DTOs**: Container validation (isoNo, size, owner, checkOk status)
- **Controller**: Complete REST endpoints
- **Module**: ContainersService provider registered
- **Status Tracking**: checkOk boolean for container readiness

#### ✅ **Critical Fixes Delivered:**

**1. Client Job Visibility**
- **Issue**: Jobs not appearing in client dashboard/live activity
- **Root Cause**: Missing `clientId` field in JobQueryDto
- **Fix**: Added clientId to `job-query.dto.ts` + updated jobs.service.ts filtering
- **File**: `apps/api/src/modules/jobs/dto/job-query.dto.ts:11-14`
- **Result**: Clients now see only their assigned jobs in real-time

**2. GPS Map Infinite Loading (Client Job Detail)**
- **Issue**: Map loading spinner never resolved on `/client/jobs/[id]`
- **Root Cause**: Missing robust loading pattern (mounted state, cancelled flag, requestAnimationFrame)
- **Fix**: Implemented complete loading pattern from working dashboard
- **File**: `apps/web/src/app/client/jobs/[id]/page.tsx`
- **Patterns Added**:
  - Mounted state for component lifecycle
  - Cancelled flag for race condition prevention
  - requestAnimationFrame for DOM-ready detection
  - Proper cleanup logic
  - Console logging for debugging
- **Result**: GPS map loads consistently on client pages

**3. Socket.IO ngrok Configuration**
- **Issue**: Mobile tracker shows "Disconnected" on ngrok
- **Investigation**: Previous implementation disabled Socket.IO entirely on ngrok detection
- **Fix**: Modified to USE `NEXT_PUBLIC_SOCKET_URL` environment variable
- **File**: `apps/web/src/contexts/SocketContext.tsx:44-52`
- **Configuration**: Polling-first transport (compatible with ngrok)
- **Workflow**:
  1. Run `ngrok http 3004` for backend API
  2. Uncomment `NEXT_PUBLIC_SOCKET_URL` in `.env.local` with ngrok URL
  3. Access mobile tracker via frontend ngrok URL
  4. Comment out when done testing
- **Status**: Ready for mobile testing (pending ngrok setup)

#### 📊 **Technical Architecture:**

**Service Layer Pattern:**
- Consistent CRUD structure across all resource modules
- Company-scoped queries enforced in every service
- BadRequestException for invalid entities
- NotFoundException for missing resources
- DTO validation with class-validator decorators

**Multi-tenant Resource Sharing:**
- General resources (clientId = null) accessible company-wide
- Client-specific resources (clientId set) for targeted assignment
- OR query pattern for flexible resource visibility
- Extensible to other resource types as needed

**Google Maps Loading Pattern:**
```typescript
// Robust pattern for map initialization
const [mounted, setMounted] = useState(false);
let cancelled = false;
let rafId: number | null = null;

const loadMap = async () => {
  if (!mapRef.current) {
    rafId = requestAnimationFrame(loadMap);
    return;
  }
  // Initialize map...
};

// Cleanup
return () => {
  cancelled = true;
  if (rafId) cancelAnimationFrame(rafId);
};
```

**Socket.IO ngrok Strategy:**
- Environment-based URL resolution
- Polling transport for ngrok compatibility
- HTTP fallback when WebSocket unavailable
- Proper logging for environment detection
- Safe .env.local configuration (gitignored)

#### 🔄 **Compilation Status:**
- ✅ Routes API: 5:22:24 PM
- ✅ Drivers API: Restarted cleanly (port 3004 killed)
- ✅ Vehicles API: 5:42:44 PM (0 errors)
- ✅ Containers API: 5:47:47 PM (0 errors)
- ✅ Job Filtering: 5:54:03 PM (0 errors)

#### 📋 **Next Steps:**
1. Complete ngrok mobile testing (requires 2 tunnels: frontend + backend)
2. Production deployment preparation
3. End-to-end workflow verification

**Phase 2.5 Achievement**: Completed all resource management APIs with client-side integration, fixed critical visibility and map loading issues, prepared Socket.IO for mobile testing.

---

### Phase S0: Foundations (Legacy Reference)
**Status**: Superseded by Phase 01

#### Setup Checklist
- [ ] Install PostgreSQL 16 with PostGIS and pgvector
- [ ] Setup NestJS backend with Prisma
- [ ] Setup Next.js frontend with TypeScript
- [ ] Configure Docker environment
- [ ] Implement multi-tenant auth system
- [ ] Create base database schema
- [ ] Setup S3/Minio for file storage
- [ ] Configure Redis for queues/cache
- [ ] Implement logging with Winston
- [ ] Setup error tracking with Sentry

#### Database Schema v1.0.0
```prisma
// Core tenant model
model Company {
  id        String   @id @default(cuid())
  name      String
  subdomain String   @unique
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users      User[]
  vehicles   Vehicle[]
  drivers    Driver[]
  jobs       Job[]
  rateCards  RateCard[]
  ragDocs    RagDocument[]
}

model User {
  id         String   @id @default(cuid())
  companyId  String
  email      String   @unique
  password   String
  role       Role
  firstName  String
  lastName   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  company Company @relation(fields: [companyId], references: [id])
  
  @@index([companyId])
}

enum Role {
  ADMIN
  DISPATCHER
  VIEWER
  DRIVER
}

// Continue with other models...
```

### Phase S1: Core Operations
**Status**: Not Started
**Dependencies**: S0 complete

- Jobs creation and assignment
- Document upload and OCR
- Trip Pack QR generation
- Live tracking infrastructure
- ETA calculations
- Rate card import
- Basic RAG implementation

### Phase S2: Robustness & Analytics
**Status**: Not Started
**Dependencies**: S1 complete

- ePOD implementation
- Notification system
- Dashboards and KPIs
- Target planner
- Advanced RAG features
- Maintenance & Fuel IQ

## CHANGELOG STRUCTURE

### Version Format: MAJOR.MINOR.PATCH-PHASE
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes
- PHASE: S0, S1, S2

### Changelog Template
```markdown
## [Version] - YYYY-MM-DD

### Added
- New features or capabilities

### Changed
- Changes to existing functionality (with migration notes)

### Fixed
- Bug fixes

### Security
- Security improvements

### Migration Required
- Step-by-step migration instructions
- SQL scripts if needed
```

## WINDOWS SETUP INSTRUCTIONS

### Prerequisites Installation
```powershell
# 1. Install Chocolatey (Package Manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Install Development Tools
choco install nodejs-lts git docker-desktop vscode postgresql16 redis -y

# 3. Install Node.js Global Packages
npm install -g pnpm @nestjs/cli prisma

# 4. Enable PostgreSQL Extensions (run in psql)
# psql -U postgres
# CREATE DATABASE logistics;
# \c logistics
# CREATE EXTENSION IF NOT EXISTS postgis;
# CREATE EXTENSION IF NOT EXISTS vector;
```

### Project Initialization - Automated Scaffold

Save and run the scaffold script:

```powershell
# scaffold_mkdir.ps1 - Creates complete directory structure
param([string]$Root = "logistics-mvp")
Write-Host "Creating scaffold in: $Root"

$dirs = @(
  "$Root/apps/web/src/app",
  "$Root/apps/web/src/components/ui",
  "$Root/apps/web/src/components/features",
  "$Root/apps/web/src/components/layouts",
  "$Root/apps/web/src/lib/hooks",
  "$Root/apps/web/src/lib/utils",
  "$Root/apps/web/src/services",
  "$Root/apps/web/src/types",
  "$Root/apps/web/src/styles",
  "$Root/apps/web/public",
  "$Root/apps/api/src/modules/auth",
  "$Root/apps/api/src/modules/jobs",
  "$Root/apps/api/src/modules/documents",
  "$Root/apps/api/src/modules/economics",
  "$Root/apps/api/src/modules/rag",
  "$Root/apps/api/src/modules/maintenance",
  "$Root/apps/api/src/modules/notifications",
  "$Root/apps/api/src/common/decorators",
  "$Root/apps/api/src/common/filters",
  "$Root/apps/api/src/common/guards",
  "$Root/apps/api/src/common/interceptors",
  "$Root/apps/api/src/config",
  "$Root/apps/api/prisma/migrations",
  "$Root/packages/shared/src/types",
  "$Root/packages/shared/src/constants",
  "$Root/packages/shared/src/utils",
  "$Root/docs/prd",
  "$Root/docs/api",
  "$Root/docs/design",
  "$Root/docker",
  "$Root/scripts",
  "$Root/.github/workflows"
)

foreach ($d in $dirs) { 
  New-Item -ItemType Directory -Force -Path $d | Out-Null 
}

# Create essential files
New-Item -ItemType File -Force -Path "$Root/.env.example" | Out-Null
New-Item -ItemType File -Force -Path "$Root/.env.local" | Out-Null
New-Item -ItemType File -Force -Path "$Root/docker-compose.yml" | Out-Null
New-Item -ItemType File -Force -Path "$Root/pnpm-workspace.yaml" | Out-Null
New-Item -ItemType File -Force -Path "$Root/.gitignore" | Out-Null
New-Item -ItemType File -Force -Path "$Root/README.md" | Out-Null
New-Item -ItemType File -Force -Path "$Root/docs/Claude.md" | Out-Null
New-Item -ItemType File -Force -Path "$Root/docs/CHANGELOG.md" | Out-Null

Write-Host "✓ Scaffold created successfully in: $Root"
```

### Run Setup
```powershell
# 1. Run scaffold script
.\scaffold_mkdir.ps1

# 2. Navigate to project
cd logistics-mvp

# 3. Initialize monorepo
pnpm init

# 4. Setup workspace configuration
@"
packages:
  - 'apps/*'
  - 'packages/*'
"@ | Set-Content -Path "pnpm-workspace.yaml"

# 5. Initialize apps
cd apps/web
pnpm create next-app@latest . --typescript --eslint --tailwind --app --no-git

cd ../api
nest new . --package-manager pnpm --skip-git

# 6. Setup shared packages
cd ../../packages/shared
pnpm init
```

## API DESIGN PRINCIPLES

### RESTful Endpoints
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Version APIs (`/v1/`)
- Use consistent naming (plural for collections)
- Return appropriate status codes
- Include pagination for lists

### Request/Response Format
```typescript
// Standard Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Standard Error Codes
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

## TESTING STRATEGY

### Test Coverage Requirements
- Unit Tests: 80% minimum for business logic
- Integration Tests: All API endpoints
- E2E Tests: Critical user flows

### Test Structure
```typescript
describe('JobService', () => {
  describe('createJob', () => {
    it('should create a job with valid data', async () => {
      // Test implementation
    });
    
    it('should reject job with invalid container ID', async () => {
      // Test implementation
    });
    
    it('should enforce tenant isolation', async () => {
      // Test implementation
    });
  });
});
```

## SECURITY CHECKLIST

- [ ] JWT tokens with refresh mechanism
- [ ] Rate limiting on all endpoints
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS protection (React default escaping)
- [ ] CORS properly configured
- [ ] Secrets in environment variables
- [ ] HTTPS only in production
- [ ] Audit logging for sensitive operations
- [ ] Regular dependency updates

## PERFORMANCE TARGETS

- Page Load: < 2s (P95)
- API Response: < 200ms (P95)
- Trip Pack Generation: < 60s
- OCR Processing: < 30s per document
- RAG Query: < 3s including citations
- Database queries: < 50ms (P95)

## MONITORING & OBSERVABILITY

### Required Metrics
- API response times
- Error rates by endpoint
- Database query performance
- Queue processing times
- OCR accuracy rates
- User session analytics

### Logging Standards
```typescript
// Use structured logging
logger.info('Job created', {
  jobId: job.id,
  companyId: company.id,
  userId: user.id,
  duration: executionTime,
});
```

## GIT WORKFLOW

### Branch Naming
- `feature/S0-auth-system`
- `fix/S1-trip-pack-generation`
- `chore/update-dependencies`

### Commit Messages
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

## DEPLOYMENT CHECKLIST

### Before Each Deployment
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Changelog updated
- [ ] API documentation updated

## TROUBLESHOOTING GUIDE

### Common Issues

#### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -U postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql postgresql://postgres:password@localhost:5432/logistics
```

#### Prisma Migration Issues
```bash
# Reset database (development only!)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate

# Check migration status
npx prisma migrate status
```

## QUESTIONS TO ASK BEFORE IMPLEMENTING

1. Is this solution production-ready or a band-aid?
2. Does this respect tenant isolation?
3. Is there proper error handling?
4. Are we creating technical debt?
5. Is this testable?
6. Will this scale?
7. Is there a migration path if we need to change it?

## ESSENTIAL CONFIGURATION FILES

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: logistics-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: logistics
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: logistics-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    container_name: logistics-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### docker/postgres/init.sql
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gin_fulltext ON rag_chunk USING gin(to_tsvector('english', text));
```

### .env.example
```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/logistics"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-change-this"

# S3/Minio (Local Development)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="logistics-assets"
S3_REGION="us-east-1"

# API Keys (Add your own)
MAPBOX_TOKEN=""
GOOGLE_MAPS_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# App Config
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### .gitignore
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
dist/
build/
out/
.next/

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite
postgres_data/
redis_data/
minio_data/

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Testing
coverage/
.nyc_output/

# Prisma
prisma/migrations/dev/

# Temporary
tmp/
temp/
*.tmp
```

### Initial Prisma Schema (apps/api/prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [postgis(version: "3.4"), vector, uuidOssp(map: "uuid-ossp"), pgTrgm(map: "pg_trgm")]
}

// Core Models
model Company {
  id        String   @id @default(cuid())
  name      String
  subdomain String   @unique
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  users        User[]
  vehicles     Vehicle[]
  drivers      Driver[]
  clients      Client[]
  jobs         Job[]
  documents    Document[]
  rateCards    RateCard[]
  ragDocuments RagDocument[]
  
  @@index([subdomain])
}

model User {
  id         String   @id @default(cuid())
  companyId  String
  email      String   @unique
  password   String
  role       Role
  firstName  String
  lastName   String
  isActive   Boolean  @default(true)
  lastLogin  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relations
  company           Company @relation(fields: [companyId], references: [id])
  assignedJobs      Job[]   @relation("AssignedBy")
  createdDocuments  Document[] @relation("CreatedBy")
  
  @@index([companyId])
  @@index([email])
}

enum Role {
  ADMIN
  DISPATCHER
  VIEWER
  DRIVER
}

model Vehicle {
  id            String   @id @default(cuid())
  companyId     String
  regNo         String
  class         String
  make          String?
  model         String?
  year          Int?
  kmpl          Float    @default(8.0)
  leasePerDay   Decimal  @db.Decimal(10, 2)
  maintPerKm    Decimal  @db.Decimal(10, 4)
  currentOdo    Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  company     Company @relation(fields: [companyId], references: [id])
  jobs        Job[]
  maintenance MaintenanceEvent[]
  fuelRecords FuelRecord[]
  
  @@unique([companyId, regNo])
  @@index([companyId])
}

// Continue with remaining models...
```

## QUICK START COMMANDS

```powershell
# 1. Run scaffold
.\scaffold_mkdir.ps1

# 2. Start Docker services
docker-compose up -d

# 3. Setup database
cd apps/api
npx prisma migrate dev --name init

# 4. Install dependencies (from root)
pnpm install

# 5. Start development servers
# Terminal 1 - Backend
cd apps/api && pnpm dev

# Terminal 2 - Frontend
cd apps/web && pnpm dev
```

## CONTACT & SUPPORT

- Documentation: `/docs` folder
- API Reference: `/docs/API.md`
- Changelog: `/docs/CHANGELOG.md`

---

Remember: **NO BAND-AIDS**. Every line of code should be production-ready from day one.
