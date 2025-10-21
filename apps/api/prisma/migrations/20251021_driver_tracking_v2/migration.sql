-- Driver Tracking V2 Complete Rewrite Migration
-- Date: 2025-10-21
-- Purpose: Add driver authentication, enhanced tracking, and earnings tracking

-- ============================================
-- PHASE 1: Driver Authentication Enhancement
-- ============================================

-- Add PIN authentication for drivers
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "pin" VARCHAR(6);
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "deviceInfo" JSON;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "totalEarnings" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "monthlyEarnings" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "currentJobId" VARCHAR(255);
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT false;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "lastLocationLat" DECIMAL(10,8);
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "lastLocationLng" DECIMAL(11,8);
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "lastLocationUpdate" TIMESTAMP;

-- Create unique constraint for driver login (company + license number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'drivers_company_license_unique'
    ) THEN
        ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_license_unique"
        UNIQUE ("companyId", "licenseNo");
    END IF;
END $$;

-- Create index for faster driver authentication
CREATE INDEX IF NOT EXISTS idx_driver_auth ON "drivers"("companyId", "licenseNo", "pin");
CREATE INDEX IF NOT EXISTS idx_driver_online ON "drivers"("companyId", "isOnline");
CREATE INDEX IF NOT EXISTS idx_driver_current_job ON "drivers"("currentJobId");

-- ============================================
-- PHASE 2: Enhanced Location Tracking
-- ============================================

-- Add enhanced tracking fields to location_tracking table
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "routeDistance" DECIMAL(10,2);
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "routeDuration" INT; -- Duration in seconds
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "deviceInfo" JSON;
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "networkType" VARCHAR(20); -- 4G, 3G, WiFi
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "batteryPercentage" INT;
ALTER TABLE "location_tracking" ADD COLUMN IF NOT EXISTS "isCharging" BOOLEAN DEFAULT false;

-- Create better indexes for location queries
CREATE INDEX IF NOT EXISTS idx_location_job_timestamp ON "location_tracking"("jobId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_location_driver_timestamp ON "location_tracking"("driverId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_location_latest ON "location_tracking"("jobId", "driverId", "timestamp" DESC);

-- ============================================
-- PHASE 3: Driver Sessions Table (New)
-- ============================================

CREATE TABLE IF NOT EXISTS "driver_sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "driverId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceInfo" JSON,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "loginAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_sessions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "driver_sessions"
    ADD CONSTRAINT "driver_sessions_driver_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_driver_session_token ON "driver_sessions"("token");
CREATE INDEX IF NOT EXISTS idx_driver_session_active ON "driver_sessions"("driverId", "isActive");
CREATE INDEX IF NOT EXISTS idx_driver_session_company ON "driver_sessions"("companyId", "isActive");

-- ============================================
-- PHASE 4: Driver Earnings Table (New)
-- ============================================

CREATE TABLE IF NOT EXISTS "driver_earnings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "driverId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "distanceBonus" DECIMAL(12,2) DEFAULT 0,
    "timeBonus" DECIMAL(12,2) DEFAULT 0,
    "nightShiftBonus" DECIMAL(12,2) DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) DEFAULT 'LKR',
    "status" VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, PAID
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP,
    "paidAt" TIMESTAMP,
    "paymentRef" TEXT,
    "earnedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_earnings_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "driver_earnings"
    ADD CONSTRAINT "driver_earnings_driver_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

ALTER TABLE "driver_earnings"
    ADD CONSTRAINT "driver_earnings_job_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;

-- Create indexes for earnings queries
CREATE INDEX IF NOT EXISTS idx_earnings_driver ON "driver_earnings"("driverId", "earnedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_job ON "driver_earnings"("jobId");
CREATE INDEX IF NOT EXISTS idx_earnings_status ON "driver_earnings"("status", "companyId");
CREATE INDEX IF NOT EXISTS idx_earnings_month ON "driver_earnings"("driverId", "earnedAt");

-- ============================================
-- PHASE 5: Real-time Tracking State Table (New)
-- ============================================

CREATE TABLE IF NOT EXISTS "tracking_state" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "driverId" TEXT NOT NULL UNIQUE,
    "jobId" TEXT,
    "companyId" TEXT NOT NULL,
    "currentLat" DECIMAL(10,8),
    "currentLng" DECIMAL(11,8),
    "currentSpeed" DECIMAL(8,2), -- km/h
    "currentHeading" DECIMAL(6,2), -- degrees
    "currentAccuracy" DECIMAL(10,2), -- meters
    "lastUpdateAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isMoving" BOOLEAN DEFAULT false,
    "totalDistance" DECIMAL(10,2) DEFAULT 0, -- km
    "totalDuration" INT DEFAULT 0, -- seconds
    "averageSpeed" DECIMAL(8,2) DEFAULT 0, -- km/h
    "maxSpeed" DECIMAL(8,2) DEFAULT 0, -- km/h
    "metadata" JSON,

    CONSTRAINT "tracking_state_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "tracking_state"
    ADD CONSTRAINT "tracking_state_driver_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE;

-- Create indexes for real-time queries
CREATE INDEX IF NOT EXISTS idx_tracking_state_driver ON "tracking_state"("driverId");
CREATE INDEX IF NOT EXISTS idx_tracking_state_job ON "tracking_state"("jobId");
CREATE INDEX IF NOT EXISTS idx_tracking_state_company ON "tracking_state"("companyId", "isMoving");

-- ============================================
-- PHASE 6: Generate Default PINs for Existing Drivers
-- ============================================

-- Generate random 6-digit PINs for existing drivers who don't have one
UPDATE "drivers"
SET "pin" = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE "pin" IS NULL;

-- ============================================
-- PHASE 7: Update Jobs Table for Better Tracking
-- ============================================

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "trackingEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "shareTrackingLink" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "trackingStartedAt" TIMESTAMP;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "lastKnownLat" DECIMAL(10,8);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "lastKnownLng" DECIMAL(11,8);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "lastKnownAddress" TEXT;

-- Create index for active tracking queries
CREATE INDEX IF NOT EXISTS idx_jobs_tracking_active ON "jobs"("companyId", "status", "trackingEnabled");

-- ============================================
-- PHASE 8: Add Tracking Permissions Table
-- ============================================

CREATE TABLE IF NOT EXISTS "tracking_permissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL,
    "entityType" VARCHAR(20) NOT NULL, -- CLIENT, PUBLIC, ADMIN
    "entityId" TEXT,
    "canView" BOOLEAN DEFAULT true,
    "canShare" BOOLEAN DEFAULT false,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_permissions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "tracking_permissions"
    ADD CONSTRAINT "tracking_permissions_job_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracking_perm_job ON "tracking_permissions"("jobId");
CREATE INDEX IF NOT EXISTS idx_tracking_perm_entity ON "tracking_permissions"("entityType", "entityId");

-- ============================================
-- PHASE 9: Create Views for Quick Access
-- ============================================

-- View for active driver locations
CREATE OR REPLACE VIEW "active_driver_locations" AS
SELECT
    d.id as driver_id,
    d.name as driver_name,
    d.phone as driver_phone,
    d.currentJobId as job_id,
    j.status as job_status,
    j.clientId as client_id,
    ts.currentLat as lat,
    ts.currentLng as lng,
    ts.currentSpeed as speed,
    ts.lastUpdateAt as last_update,
    ts.isMoving as is_moving,
    d.companyId as company_id
FROM drivers d
LEFT JOIN tracking_state ts ON d.id = ts.driverId
LEFT JOIN jobs j ON d.currentJobId = j.id
WHERE d.isOnline = true AND d.isActive = true;

-- View for job tracking summary
CREATE OR REPLACE VIEW "job_tracking_summary" AS
SELECT
    j.id as job_id,
    j.status,
    j.companyId as company_id,
    j.clientId as client_id,
    d.name as driver_name,
    v.regNo as vehicle_reg,
    ts.currentLat as current_lat,
    ts.currentLng as current_lng,
    ts.currentSpeed as current_speed,
    ts.totalDistance as total_distance,
    ts.totalDuration as total_duration,
    ts.averageSpeed as avg_speed,
    ts.lastUpdateAt as last_update
FROM jobs j
LEFT JOIN drivers d ON j.driverId = d.id
LEFT JOIN vehicles v ON j.vehicleId = v.id
LEFT JOIN tracking_state ts ON d.id = ts.driverId AND ts.jobId = j.id
WHERE j.trackingEnabled = true;

-- ============================================
-- PHASE 10: Grant Permissions
-- ============================================

-- Grant permissions to the application user (if needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================
-- Migration Complete
-- ============================================