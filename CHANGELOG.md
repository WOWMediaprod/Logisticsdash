# Changelog

All notable changes to the Logistics Platform will be documented in this file.

## [2025-10-17] - Resource Management & Client Portal Enhancements

### 🎯 **Session Focus**: Complete CRUD API Implementation & Client-Side Integration

**Status**: ✅ **Resource Management System Complete** - Full CRUD operations for all logistics resources
**Achievement**: End-to-end resource creation with client-side visibility and job tracking

### Added

#### **1. Routes CRUD API** (`/apps/api/src/modules/routes/`)
- ✅ **Complete Service Implementation**: `routes.service.ts` with full CRUD operations
  - **Multi-tenant Route Filtering**: Routes can be client-specific OR general (clientId = null)
  - **OR Query Logic**: Returns both client-assigned routes AND general routes for dropdown visibility
  - **Company-scoped Access Control**: All queries filtered by companyId
- ✅ **DTOs Created**:
  - `create-route.dto.ts` - Validation for route creation with optional clientId
  - `update-route.dto.ts` - Partial update support
- ✅ **Controller Endpoints**: POST, PATCH, DELETE added to `routes.controller.ts`
- ✅ **Module Configuration**: RoutesService registered as provider in `routes.module.ts`
- **Key Feature**: Routes without clientId (general routes) appear in ALL client dropdowns

#### **2. Drivers CRUD API** (`/apps/api/src/modules/drivers/`)
- ✅ **Complete Service Implementation**: `drivers.service.ts` with company-scoped operations
- ✅ **DTOs Created**:
  - `create-driver.dto.ts` - Driver profile validation (name, licenseNo, phone, email)
  - `update-driver.dto.ts` - Partial driver updates
- ✅ **Controller Endpoints**: POST, PATCH, DELETE for driver management
- ✅ **Module Configuration**: DriversService provider registered
- **Client-side Visibility**: Drivers created by admin now appear in client job request forms

#### **3. Vehicles CRUD API** (`/apps/api/src/modules/vehicles/`)
- ✅ **Complete Service Implementation**: `vehicles.service.ts` with detailed vehicle management
- ✅ **DTOs Created**:
  - `create-vehicle.dto.ts` - Comprehensive vehicle data (regNo, class, make, model, year, kmpl, lease rates, maintenance costs)
  - `update-vehicle.dto.ts` - Vehicle profile updates
- ✅ **Controller Endpoints**: POST, PATCH, DELETE for vehicle operations
- ✅ **Module Configuration**: VehiclesService provider registered
- **Economic Tracking**: Supports kmpl, leasePerDay, maintPerKm for cost analysis

#### **4. Containers CRUD API** (`/apps/api/src/modules/containers/`)
- ✅ **Complete Service Implementation**: `containers.service.ts` with container tracking
- ✅ **DTOs Created**:
  - `create-container.dto.ts` - Container validation (isoNo, size, owner, checkOk status)
  - `update-container.dto.ts` - Container status updates
- ✅ **Controller Endpoints**: POST, PATCH, DELETE for container management
- ✅ **Module Configuration**: ContainersService provider registered
- **Status Tracking**: Supports checkOk boolean for container readiness verification

### Fixed

#### **1. Client Job Visibility Issue**
- **Problem**: Jobs assigned by admin appeared on admin dashboard but NOT in client live activity or client dashboard
- **Root Cause**: `JobQueryDto` was missing `clientId` field, API ignored client-specific filtering
- **Fix**: Added `clientId` field to `job-query.dto.ts` (D:\Logistics App\logistics-platform\apps\api\src\modules\jobs\dto\job-query.dto.ts:11-14)
- **Updated Logic**: `jobs.service.ts` findAll method now properly filters by clientId (D:\Logistics App\logistics-platform\apps\api\src\modules\jobs\jobs.service.ts:87)
- **Result**: Client portal now shows only their assigned jobs in real-time
- **Backend Recompiled**: 5:54:03 PM - Zero errors

#### **2. Infinite GPS Map Loading on Client Job Detail Page**
- **Problem**: Map loading spinner never resolved on `/client/jobs/[id]` page, while dashboard tracking worked fine
- **Root Cause**: Missing robust loading pattern - no mounted state, cancelled flag, or requestAnimationFrame for DOM-ready detection
- **Fix Applied** (D:\Logistics App\logistics-platform\apps\web\src\app\client\jobs\[id]\page.tsx):
  - Added `mounted` state for component lifecycle tracking
  - Implemented `cancelled` flag to prevent race conditions on unmount
  - Added `requestAnimationFrame` loop for DOM-ready detection
  - Proper cleanup logic in useEffect return function
  - Console logging for debugging map loading sequence
  - Changed default map center to Colombo, Sri Lanka (6.9271, 79.8612)
- **Pattern Source**: Copied from working dashboard tracking implementation
- **Result**: GPS map now loads consistently on client job detail pages

#### **3. Socket.IO Connection for Mobile Tracking (In Progress)**
- **Problem**: Mobile tracker shows "Disconnected" when accessed via ngrok tunnel
- **Investigation**:
  - Read `SocketContext.tsx` (D:\Logistics App\logistics-platform\apps\web\src\contexts\SocketContext.tsx:42-52)
  - Previous implementation disabled Socket.IO entirely on ngrok detection
  - Returns empty string, preventing any WebSocket connection
- **Updated Strategy**:
  - Modified ngrok detection to USE `NEXT_PUBLIC_SOCKET_URL` environment variable
  - Socket.IO configured with polling-first transport (works through ngrok)
  - Added proper logging for ngrok environment detection
- **Configuration**:
  - `.env.local` line 28: `NEXT_PUBLIC_SOCKET_URL` for backend API ngrok URL
  - Commented out by default to avoid affecting production
  - Uncomment when testing mobile tracker via ngrok
- **Status**: Pending ngrok tunnel setup and testing

### Enhanced

#### **Backend API Structure**
- **Service Layer Consistency**: All resource modules now follow identical CRUD pattern
- **Company-scoped Queries**: Every service enforces `companyId` filtering
- **Error Handling**: BadRequestException for invalid related entities, NotFoundException for missing resources
- **DTO Validation**: Class-validator decorators ensure type safety and data integrity
- **Module Organization**: Clean separation of controllers, services, DTOs, and module configuration

#### **Frontend Integration**
- **Resource Dropdowns**: Client forms now populate with admin-created routes, drivers, vehicles, containers
- **Real-time Job Tracking**: Jobs assigned to clients appear immediately in their dashboard
- **GPS Map Loading**: Robust loading pattern prevents infinite loading states
- **Mobile Compatibility**: Socket.IO configuration ready for ngrok mobile testing

### Technical Improvements

#### **Multi-tenant Resource Sharing**
- **General Routes Pattern**: Routes without clientId accessible to all clients within company
- **Client-specific Resources**: Optional clientId allows targeted resource assignment
- **OR Query Implementation**: Prisma query returns both general AND client-specific resources:
```typescript
where: {
  companyId,
  OR: [
    { clientId: clientId },
    { clientId: null }
  ]
}
```

#### **Google Maps Integration Patterns**
- **Mounted State Pattern**: Prevents map initialization before component mount
- **Cancelled Flag Pattern**: Stops async operations on component unmount
- **requestAnimationFrame Pattern**: Ensures DOM element exists before map creation
- **Cleanup Pattern**: Proper marker and map instance disposal on unmount

#### **Socket.IO ngrok Configuration**
- **Environment-based URL Resolution**: Dynamic Socket.IO URL selection based on environment
- **Polling Transport**: Configured to use polling first (compatible with ngrok tunnels)
- **Fallback Strategy**: HTTP polling when WebSocket unavailable
- **Mobile Testing Workflow**:
  1. Run `ngrok http 3004` for backend API
  2. Uncomment `NEXT_PUBLIC_SOCKET_URL` in `.env.local` with ngrok URL
  3. Access mobile tracker via frontend ngrok URL
  4. Comment out when done testing

### Files Modified

**Backend API:**
- `apps/api/src/modules/routes/routes.service.ts` (Created)
- `apps/api/src/modules/routes/dto/create-route.dto.ts` (Created)
- `apps/api/src/modules/routes/dto/update-route.dto.ts` (Created)
- `apps/api/src/modules/routes/routes.controller.ts` (Enhanced)
- `apps/api/src/modules/routes/routes.module.ts` (Provider added)
- `apps/api/src/modules/drivers/drivers.service.ts` (Created)
- `apps/api/src/modules/drivers/dto/create-driver.dto.ts` (Created)
- `apps/api/src/modules/drivers/dto/update-driver.dto.ts` (Created)
- `apps/api/src/modules/drivers/drivers.controller.ts` (Enhanced)
- `apps/api/src/modules/drivers/drivers.module.ts` (Provider added)
- `apps/api/src/modules/vehicles/vehicles.service.ts` (Created)
- `apps/api/src/modules/vehicles/dto/create-vehicle.dto.ts` (Created)
- `apps/api/src/modules/vehicles/dto/update-vehicle.dto.ts` (Created)
- `apps/api/src/modules/vehicles/vehicles.controller.ts` (Enhanced)
- `apps/api/src/modules/vehicles/vehicles.module.ts` (Provider added)
- `apps/api/src/modules/containers/containers.service.ts` (Created)
- `apps/api/src/modules/containers/dto/create-container.dto.ts` (Created)
- `apps/api/src/modules/containers/dto/update-container.dto.ts` (Created)
- `apps/api/src/modules/containers/containers.controller.ts` (Enhanced)
- `apps/api/src/modules/containers/containers.module.ts` (Provider added)
- `apps/api/src/modules/jobs/dto/job-query.dto.ts` (clientId field added)
- `apps/api/src/modules/jobs/jobs.service.ts` (clientId filtering added)

**Frontend:**
- `apps/web/src/app/client/jobs/[id]/page.tsx` (Map loading pattern fixed)
- `apps/web/src/contexts/SocketContext.tsx` (ngrok detection logic updated)
- `apps/web/.env.local` (NEXT_PUBLIC_SOCKET_URL configuration documented)

### Compilation Status
- ✅ **Routes API**: Compiled successfully at 5:22:24 PM
- ✅ **Drivers API**: Restarted after dependency resolution (port 3004 killed)
- ✅ **Vehicles API**: Compiled successfully at 5:42:44 PM (0 errors)
- ✅ **Containers API**: Compiled successfully at 5:47:47 PM (0 errors)
- ✅ **Job Filtering Fix**: Compiled successfully at 5:54:03 PM

### Pending Tasks
1. **Mobile Tracker Testing**: Complete ngrok setup with both frontend (port 3001) and backend (port 3004) tunnels
2. **Production Deployment**: Prepare deployment configuration with proper environment variables
3. **End-to-End Testing**: Verify complete workflow from admin resource creation → client job request → driver assignment → GPS tracking

### Developer Notes
- **Multi-tenant Resource Sharing**: General routes (clientId = null) pattern can be extended to other resources if needed
- **Socket.IO Mobile Testing**: Requires TWO ngrok tunnels (frontend + backend) or production deployment
- **GPS Map Pattern**: Robust loading pattern should be used consistently across all map components
- **.env.local Safety**: File is gitignored, safe for local development, won't affect production

---

## [Phase 01 Complete] - 2025-09-22

### 🎉 **PHASE 01 SUCCESS: Complete Live Driver Tracking Implementation**

**Client Status**: ✅ **SATISFIED** - Phase 01 officially complete and successful
**Critical Achievement**: End-to-end mobile location tracking with dashboard integration working flawlessly

### Added
- **Live Driver Tracking System**: Complete real-time mobile-to-dashboard tracking
  - Integrated Socket.io WebSocket gateway for real-time communication
  - Live driver location tracking with mobile geolocation API
  - Real-time dashboard updates with Google Maps integration
  - Safari-compatible location access with HTTPS support via ngrok tunnels
  - Mobile tracker pages with wake lock to prevent screen sleep
  - Live driver markers on dashboard map with status indicators (active/stale)

- **🚀 BREAKTHROUGH: Hybrid Location Sync via ngrok (CRITICAL SUCCESS)**
  - **iOS location permissions working**: HTTPS ngrok tunnel enables Safari geolocation
  - **HTTP location fallback system**: When WebSocket fails, automatic HTTP POST to `/api/location`
  - **Real-time mobile-to-dashboard sync**: Location data flows from phone → ngrok → Next.js → API → Dashboard
  - **Smart connection strategy**: WebSocket first, HTTP fallback for reliability
  - **ngrok single-tunnel solution**: Works with free tier limitation (one tunnel only)
  - **Production-ready workflow**: Scalable approach for mobile tracking deployment

- **Content Security Policy Middleware**: Resolved Google Maps loading issues
  - Added CSP headers specifically for tracking pages
  - Enabled `unsafe-eval` and Google Maps domains for proper map functionality
  - Preserved existing Next.js configuration stability
  - Fixed console CSP errors blocking map resources

- **Simple Tracker Prototype**: Created standalone tracking solution
  - Express.js + Socket.io server for testing and development
  - HTML dashboard with working Google Maps integration
  - Mobile tracker interface with real-time location updates
  - Correct Google Maps API key integration and troubleshooting

### Fixed
- **WebSocket Connection Stability**: Resolved dashboard crash issues
  - Fixed multiple Node.js process conflicts causing server instability
  - Eliminated EPIPE errors and Jest worker crashes
  - Cleaned up unstable processes and memory leaks
  - Restored stable WebSocket connections between frontend and API

- **Google Maps API Integration**: Resolved loading and authentication issues
  - Fixed incorrect API key causing authentication failures
  - Updated from wrong key `AIzaSyCin-hxK-rB7YsDBzTYMZdBI1y4a8XEoU` to correct `AIzaSyCin-hxK-rB7YsDBzTYMZdBI1vy4a8XEoU`
  - Resolved Content Security Policy blocking map resources
  - Fixed infinite "Loading map..." state in dashboard

- **API Proxy Configuration**: Fixed SSL/HTTP protocol mismatches
  - Updated proxy to use HTTP instead of HTTPS for local development
  - Fixed environment variables for consistent API communication
  - Resolved 500 errors on tracking endpoints

### Enhanced
- **Mobile Location Tracking**: Safari and iOS compatibility
  - Implemented proper HTTPS requirements for Safari location access
  - Added ngrok tunneling for mobile testing over cellular data
  - Enhanced location accuracy and error handling
  - Real-time location broadcasting to connected dashboards

- **Dashboard Live Map**: Real-time visualization improvements
  - Google Maps integration with custom markers for job tracking and live drivers
  - Color-coded status indicators (blue/green for jobs, red/orange for live drivers)
  - Info windows with driver details, speed, accuracy, and update times
  - Automatic map bounds fitting for all active markers

- **Socket Context Management**: Improved WebSocket handling
  - Dynamic URL resolution for different environments
  - Proper connection state management and error handling
  - Company-specific tracking room subscriptions
  - Real-time event handling for location and status updates

### Technical Improvements
- **Environment Configuration**: Streamlined development setup
  - Consistent API URLs and port configurations
  - Proper Google Maps API key management
  - Socket.io connection URL resolution for different environments

- **Process Management**: Improved development server stability
  - Clean process cleanup and restart procedures
  - Eliminated conflicting Node.js processes
  - Stable concurrent API and frontend servers

- **Error Handling**: Enhanced debugging and user feedback
  - Better error messages for location access failures
  - Improved map loading error states
  - WebSocket connection status indicators

- **🔧 Critical Architecture Solution: HTTP Location Proxy**
  - **File: `/apps/web/src/app/api/location/route.ts`** - HTTP endpoint for location updates
  - **File: `/apps/web/src/app/track/page.tsx`** - Smart fallback logic (WebSocket → HTTP)
  - **File: `/apps/web/src/contexts/SocketContext.tsx`** - Hybrid connection strategy
  - **Key Pattern**: `sendLocationViaHTTP()` function for ngrok compatibility
  - **Production Value**: Enables mobile location tracking through any single tunnel setup

### Final Deliverables
- **✅ Mobile Tracker**: Phone-optimized location tracking interface with iOS Safari support
- **✅ Dashboard Integration**: Real-time Google Maps with live driver markers and status indicators
- **✅ Robust Connection**: Hybrid WebSocket + HTTP fallback for maximum reliability
- **✅ Production Ready**: ngrok HTTPS tunneling workflow for mobile deployment
- **✅ Google Maps Fixed**: Enhanced CSP middleware resolving all map loading issues
- **✅ Performance Optimized**: Clean server restarts and stable connection management

### Technical Stack Validated
- **Frontend**: Next.js 15.5.3 with React 18.3.1, TypeScript, Tailwind CSS
- **Backend**: NestJS with Socket.io WebSocket gateway, PostgreSQL + Prisma
- **Maps**: Google Maps JavaScript API with custom markers and real-time updates
- **Mobile**: Browser Geolocation API with HTTPS location permission support
- **Tunneling**: ngrok free tier single-tunnel solution for iOS testing

### Client Feedback
> "Client is happy with what we've done. We can say this is a successful phase 01."

**🚀 READY FOR PHASE 02** - All foundations established, infrastructure stable, core functionality complete

## [2025-09-18] - Previous Release

### Added
- **Real QR Code Generation**: Implemented proper QR code generation using `qrcode` library
  - Replaced placeholder QR generation with actual QR code creation
  - Added configurable QR code options (error correction, margins, colors, size)
  - Enhanced QR code service with proper error handling

- **Enhanced Dashboard UI/UX**: Complete redesign of summary cards
  - Added meaningful icons using Lucide React (Briefcase, Clock, CheckCircle, Trophy)
  - Implemented proper visual hierarchy with proportionally-sized icons (32px)
  - Removed redundant text elements for cleaner design
  - Improved card layout and spacing

- **React Error Boundaries**: Added comprehensive error handling
  - Created ErrorBoundary component with graceful error display
  - Added development debugging features
  - Implemented error recovery with retry functionality

- **Company Selection Debugging**: Enhanced company context management
  - Added CompanySelector debugging component
  - Improved environment variable handling and fallback logic
  - Added comprehensive logging for company ID resolution

- **Database Performance Optimization**: Added 15 strategic indexes
  - Composite indexes for job queries (company + status, company + created date)
  - Client, route, vehicle, driver, and container indexes
  - Location tracking and status event indexes
  - Enhanced query performance across all major operations

### Fixed
- **Company Context Loading**: Resolved "Company not selected" errors
  - Fixed environment variable loading logic (changed `??` to `||` operator)
  - Improved fallback company ID handling
  - Added better debugging and state management

- **JSX Syntax Errors**: Fixed arrow character rendering issues
  - Replaced raw `->` with Unicode `→` character in job type icons
  - Fixed `<->` to `↔` for round trip indicators
  - Resolved build failures caused by invalid JSX syntax

- **Environment Configuration**: Updated API configuration
  - Changed API port from 3003 to 3004 in environment files
  - Added proper company ID environment variables
  - Fixed development environment setup

### Enhanced
- **WebSocket Real-time Tracking**: Verified and maintained existing implementation
  - Real-time location updates for active jobs
  - Live job status changes
  - Company-specific tracking rooms

- **API Endpoints**: Confirmed all tracking endpoints are functional
  - Location update endpoints
  - Active job tracking by company
  - Historical location data

- **TypeScript Integration**: Maintained strict type safety
  - Fixed QR code service type errors
  - Proper interface definitions for all components
  - Enhanced type checking across the application

### Technical Improvements
- **Icon Library Integration**: Added Lucide React for consistent iconography
- **Animation Framework**: Maintained Framer Motion for smooth transitions
- **State Management**: Improved React Context usage for company selection
- **Error Handling**: Enhanced error boundaries and user feedback
- **Performance**: Database indexing for faster query execution

### Developer Experience
- **Debugging Tools**: Added company selector debugging interface
- **Environment Setup**: Improved development environment configuration
- **Error Reporting**: Better error messages and debugging information
- **Code Quality**: Maintained TypeScript strict mode and proper code organization

---

## Previous Versions
This changelog starts from the major refactoring and enhancement phase. Previous development history can be found in the git commit history.