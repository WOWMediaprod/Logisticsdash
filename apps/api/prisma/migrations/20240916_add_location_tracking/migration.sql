-- Add location tracking tables for real-time GPS tracking

-- Location tracking table for storing driver GPS coordinates
CREATE TABLE "location_tracking" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "accuracy" DECIMAL(10,2),
    "altitude" DECIMAL(10,2),
    "speed" DECIMAL(8,2),
    "heading" DECIMAL(6,2),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "batteryLevel" INTEGER,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'MOBILE_GPS',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_tracking_pkey" PRIMARY KEY ("id")
);

-- Geofences table for defining pickup/delivery zones
CREATE TABLE "geofences" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CIRCLE',
    "centerLat" DECIMAL(10,8) NOT NULL,
    "centerLng" DECIMAL(11,8) NOT NULL,
    "radius" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "polygon" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- Geofence events table for tracking entry/exit events
CREATE TABLE "geofence_events" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "autoDetected" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofence_events_pkey" PRIMARY KEY ("id")
);

-- Route waypoints for planned route tracking
CREATE TABLE "route_waypoints" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CHECKPOINT',
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_waypoints_pkey" PRIMARY KEY ("id")
);

-- ETA calculations table
CREATE TABLE "eta_calculations" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "currentLat" DECIMAL(10,8) NOT NULL,
    "currentLng" DECIMAL(11,8) NOT NULL,
    "destinationLat" DECIMAL(10,8) NOT NULL,
    "destinationLng" DECIMAL(11,8) NOT NULL,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "estimatedDistance" DECIMAL(10,2) NOT NULL,
    "trafficFactor" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "calculationMethod" TEXT NOT NULL DEFAULT 'GOOGLE_MAPS',
    "confidence" DECIMAL(4,2) NOT NULL DEFAULT 0.8,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eta_calculations_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "location_tracking" ADD CONSTRAINT "location_tracking_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_tracking" ADD CONSTRAINT "location_tracking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_tracking" ADD CONSTRAINT "location_tracking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "geofences" ADD CONSTRAINT "geofences_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eta_calculations" ADD CONSTRAINT "eta_calculations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "location_tracking_jobId_timestamp_idx" ON "location_tracking"("jobId", "timestamp" DESC);
CREATE INDEX "location_tracking_driverId_timestamp_idx" ON "location_tracking"("driverId", "timestamp" DESC);
CREATE INDEX "location_tracking_timestamp_idx" ON "location_tracking"("timestamp" DESC);

CREATE INDEX "geofences_companyId_isActive_idx" ON "geofences"("companyId", "isActive");

CREATE INDEX "geofence_events_jobId_timestamp_idx" ON "geofence_events"("jobId", "timestamp" DESC);
CREATE INDEX "geofence_events_driverId_timestamp_idx" ON "geofence_events"("driverId", "timestamp" DESC);

CREATE INDEX "route_waypoints_jobId_sequence_idx" ON "route_waypoints"("jobId", "sequence");

CREATE INDEX "eta_calculations_jobId_createdAt_idx" ON "eta_calculations"("jobId", "createdAt" DESC);