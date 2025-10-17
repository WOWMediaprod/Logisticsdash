-- Performance optimization indexes

-- Jobs table: Compound indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "jobs_company_status_created_idx" ON "jobs"("companyId", "status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "jobs_company_client_status_idx" ON "jobs"("companyId", "clientId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "jobs_company_driver_status_idx" ON "jobs"("companyId", "driverId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "jobs_status_eta_idx" ON "jobs"("status", "etaTs") WHERE "status" IN ('ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY');

-- Location tracking: Optimize for real-time tracking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "location_tracking_job_timestamp_desc_idx" ON "location_tracking"("jobId", "timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "location_tracking_driver_latest_idx" ON "location_tracking"("driverId", "timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "location_tracking_recent_idx" ON "location_tracking"("timestamp" DESC) WHERE "timestamp" > NOW() - INTERVAL '24 hours';

-- Status events: For timeline and audit trails
CREATE INDEX CONCURRENTLY IF NOT EXISTS "status_events_job_timestamp_desc_idx" ON "status_events"("jobId", "timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "status_events_code_timestamp_idx" ON "status_events"("code", "timestamp" DESC);

-- Documents: For file management and search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_company_type_created_idx" ON "documents"("companyId", "type", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_job_type_idx" ON "documents"("jobId", "type") WHERE "jobId" IS NOT NULL;

-- Rate cards: For pricing calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rate_cards_client_container_active_idx" ON "rate_cards"("clientId", "containerSize", "isActive") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rate_cards_route_container_active_idx" ON "rate_cards"("routeId", "containerSize", "isActive") WHERE "isActive" = true;

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_company_active_lastlogin_idx" ON "users"("companyId", "isActive", "lastLogin" DESC);

-- Geofence events for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "geofence_events_job_type_timestamp_idx" ON "geofence_events"("jobId", "eventType", "timestamp" DESC);

-- Audit logs: For security and compliance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_company_action_timestamp_idx" ON "audit_logs"("companyId", "action", "timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_resource_timestamp_idx" ON "audit_logs"("resource", "resourceId", "timestamp" DESC);

-- Maintenance events: For fleet management
CREATE INDEX CONCURRENTLY IF NOT EXISTS "maintenance_events_vehicle_type_date_idx" ON "maintenance_events"("vehicleId", "serviceType", "eventDate" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "maintenance_events_next_service_idx" ON "maintenance_events"("vehicleId", "nextServiceDate") WHERE "nextServiceDate" IS NOT NULL AND "isCompleted" = true;

-- Fuel records: For efficiency analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fuel_records_vehicle_date_desc_idx" ON "fuel_records"("vehicleId", "date" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fuel_records_route_class_date_idx" ON "fuel_records"("routeClass", "date" DESC) WHERE "routeClass" IS NOT NULL;