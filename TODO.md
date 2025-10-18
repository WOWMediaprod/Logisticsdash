# TODO: Production Implementation Tasks

## ⚠️ CRITICAL: Remove Hardcoded Company IDs

**Current Issue:**
- Company IDs are hardcoded throughout the application (e.g., `cmfmbojit0000vj0ch078cnbu`)
- This is **ONLY FOR TESTING** the initial deployment
- **MUST** be replaced with proper authentication before real production use

**What Needs to Be Implemented:**

### 1. Authentication System
- [ ] Add user registration and login
- [ ] Implement JWT tokens or session-based auth
- [ ] Create login/register pages
- [ ] Add password hashing (bcrypt)
- [ ] Store user credentials securely

### 2. User-Company Relationship
- [ ] Link users to companies in database (add `User` model)
- [ ] Get `companyId` from authenticated user's profile
- [ ] Remove all hardcoded `cmfmbojit0000vj0ch078cnbu` references

### 3. Protected Routes
- [ ] Add authentication middleware
- [ ] Redirect unauthenticated users to login page
- [ ] Verify user tokens on backend API calls
- [ ] Auto-inject `companyId` from logged-in user

### 4. Multi-tenancy
- [ ] Ensure data isolation between companies
- [ ] Add company-level permissions
- [ ] Implement role-based access control (admin, manager, staff)

**Files That Currently Have Hardcoded Company IDs:**
- `apps/web/src/contexts/CompanyContext.tsx`
- `apps/web/src/app/dashboard/documents/page.tsx`
- Various other dashboard pages

---

## User Experience Improvements

### Better Error Handling & Validation
**Current Issue:**
- Backend validation errors are shown directly to users (e.g., "kmEstimate must be a number conforming to the specified constraints")
- Error messages are technical and not user-friendly
- Form validation happens only on submit, not in real-time

**What Needs to Be Implemented:**
- [ ] Add client-side form validation before submitting
- [ ] Show user-friendly error messages instead of technical validation errors
- [ ] Add real-time field validation (show errors as user types)
- [ ] Improve error message mapping from backend to frontend
- [ ] Add input type constraints (e.g., `type="number"` for distance fields)
- [ ] Show field-specific errors next to each input field
- [ ] Add helpful placeholder text and tooltips
- [ ] Implement better error states (red borders, icons, etc.)

**Examples of Improvements:**
- ❌ Current: "kmEstimate must be a number conforming to the specified constraints"
- ✅ Better: "Please enter a valid number for distance (e.g., 1450)"

- ❌ Current: "Foreign key constraint violated on the constraint: `clients_companyId_fkey`"
- ✅ Better: "Unable to create client. Please contact support."

---

## Other Post-Deployment Tasks

- [ ] Set up proper error monitoring (Sentry, LogRocket, etc.)
- [ ] Add rate limiting for API endpoints
- [ ] Implement proper logging system
- [ ] Set up database backups
- [ ] Add health checks and monitoring
- [ ] Configure CDN for static assets
- [ ] Set up SSL certificates (if not auto-configured)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement proper email service for notifications
- [ ] Add analytics tracking

---

**Created:** October 18, 2025
**Priority:** HIGH - Authentication must be added before real production use
