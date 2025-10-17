-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'DISPATCHER', 'VIEWER', 'DRIVER', 'PORT_OFFICER');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('ONE_WAY', 'ROUND_TRIP', 'MULTI_STOP', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."WaypointType" AS ENUM ('PICKUP', 'DELIVERY', 'CHECKPOINT', 'REST_STOP', 'YARD', 'PORT');

-- CreateEnum
CREATE TYPE "public"."EventSource" AS ENUM ('MANUAL', 'GEOFENCE', 'API', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('BOL', 'INVOICE', 'DELIVERY_NOTE', 'GATE_PASS', 'CUSTOMS', 'INSURANCE', 'PHOTO', 'SIGNATURE', 'RELEASE_ORDER', 'CDN', 'LOADING_PASS', 'FCL_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'OIL_CHANGE', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'TRANSMISSION', 'ELECTRICAL', 'BODY_WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."UsageMetric" AS ENUM ('TRIP_PACK_GENERATED', 'DOCUMENT_PROCESSED', 'RAG_QUERY', 'API_CALL', 'STORAGE_GB', 'BANDWIDTH_GB');

-- CreateEnum
CREATE TYPE "public"."JobRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('JOB_REQUEST_SUBMITTED', 'JOB_REQUEST_REVIEWED', 'JOB_REQUEST_ACCEPTED', 'JOB_REQUEST_DECLINED', 'JOB_ASSIGNED', 'JOB_STARTED', 'JOB_UPDATE', 'JOB_COMPLETED', 'JOB_DELAYED', 'JOB_EMERGENCY', 'ETA_UPDATED', 'DOCUMENT_UPLOADED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "regNo" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "kmpl" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "leasePerDay" DECIMAL(10,2) NOT NULL,
    "maintPerKm" DECIMAL(10,4) NOT NULL,
    "currentOdo" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drivers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "terms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."routes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "code" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "kmEstimate" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."containers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "iso" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "owner" TEXT,
    "checkOk" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "routeId" TEXT,
    "containerId" TEXT,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "assignedBy" TEXT,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'CREATED',
    "jobType" "public"."JobType" NOT NULL DEFAULT 'ONE_WAY',
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',
    "etaTs" TIMESTAMP(3),
    "pickupTs" TIMESTAMP(3),
    "dropTs" TIMESTAMP(3),
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waypoints" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."WaypointType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "radiusM" INTEGER NOT NULL DEFAULT 150,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."location_tracking" (
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

-- CreateTable
CREATE TABLE "public"."geofences" (
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

-- CreateTable
CREATE TABLE "public"."geofence_events" (
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

-- CreateTable
CREATE TABLE "public"."route_waypoints" (
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

-- CreateTable
CREATE TABLE "public"."eta_calculations" (
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

-- CreateTable
CREATE TABLE "public"."status_events" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "note" TEXT,
    "metadata" JSONB,
    "source" "public"."EventSource" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "public"."DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "ocrData" JSONB,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isOriginal" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trip_packs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bundleUrl" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accessCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pod" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "signatureUrl" TEXT,
    "photos" JSONB,
    "sealNo" TEXT,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_cards" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "routeId" TEXT,
    "containerSize" TEXT NOT NULL,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "fuelSurchargePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "freeTimeHours" INTEGER NOT NULL DEFAULT 0,
    "detentionRatePerHour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "waitingRatePerHour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tollsFlat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_economics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "revExpected" DECIMAL(12,2) NOT NULL,
    "revActual" DECIMAL(12,2),
    "costExpected" DECIMAL(12,2) NOT NULL,
    "costActual" DECIMAL(12,2),
    "marginExpected" DECIMAL(12,2) NOT NULL,
    "marginActual" DECIMAL(12,2),
    "marginPctExpected" DECIMAL(5,2) NOT NULL,
    "marginPctActual" DECIMAL(5,2),
    "variance" JSONB,
    "rateCardUsed" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_economics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_events" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "odometerKm" INTEGER NOT NULL,
    "serviceType" "public"."MaintenanceType" NOT NULL,
    "description" TEXT,
    "partsUsed" TEXT,
    "laborHours" DOUBLE PRECISION,
    "notes" TEXT,
    "costAmount" DECIMAL(10,2),
    "costCurrency" TEXT DEFAULT 'INR',
    "vendorName" TEXT,
    "nextServiceKm" INTEGER,
    "nextServiceDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fuel_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "litres" DECIMAL(8,2),
    "costAmount" DECIMAL(10,2),
    "costPerLitre" DECIMAL(6,2),
    "odometerKm" INTEGER,
    "routeClass" TEXT,
    "fuelStation" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rag_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rag_chunks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "embedding" BYTEA,
    "chunkIndex" INTEGER NOT NULL,
    "startChar" INTEGER,
    "endChar" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_meters" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metric" "public"."UsageMetric" NOT NULL,
    "value" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',
    "requestedPickupTs" TIMESTAMP(3),
    "requestedDropTs" TIMESTAMP(3),
    "pickupAddress" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "pickupLat" DECIMAL(10,8),
    "pickupLng" DECIMAL(11,8),
    "deliveryLat" DECIMAL(10,8),
    "deliveryLng" DECIMAL(11,8),
    "containerType" TEXT,
    "specialRequirements" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "status" "public"."JobRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "jobId" TEXT,
    "lorryNumber" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_request_updates" (
    "id" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_request_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_request_documents" (
    "id" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_updates" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."JobStatus",
    "location" JSONB,
    "eta" TIMESTAMP(3),
    "severity" TEXT,
    "isVisibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'USER',
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "jobId" TEXT,
    "jobRequestId" TEXT,
    "jobUpdateId" TEXT,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "channels" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bills" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "public"."BillStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "attachedDocumentIds" JSONB,
    "notes" TEXT,
    "sentToClient" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_subdomain_key" ON "public"."companies"("subdomain");

-- CreateIndex
CREATE INDEX "companies_subdomain_idx" ON "public"."companies"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "public"."users"("companyId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_company_active_lastlogin_idx" ON "public"."users"("companyId", "isActive", "lastLogin" DESC);

-- CreateIndex
CREATE INDEX "vehicles_companyId_idx" ON "public"."vehicles"("companyId");

-- CreateIndex
CREATE INDEX "vehicles_isActive_idx" ON "public"."vehicles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_companyId_regNo_key" ON "public"."vehicles"("companyId", "regNo");

-- CreateIndex
CREATE INDEX "drivers_companyId_idx" ON "public"."drivers"("companyId");

-- CreateIndex
CREATE INDEX "drivers_isActive_idx" ON "public"."drivers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_companyId_licenseNo_key" ON "public"."drivers"("companyId", "licenseNo");

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "public"."clients"("companyId");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "public"."clients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_code_key" ON "public"."clients"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "routes_code_key" ON "public"."routes"("code");

-- CreateIndex
CREATE INDEX "routes_companyId_idx" ON "public"."routes"("companyId");

-- CreateIndex
CREATE INDEX "routes_clientId_idx" ON "public"."routes"("clientId");

-- CreateIndex
CREATE INDEX "routes_isActive_idx" ON "public"."routes"("isActive");

-- CreateIndex
CREATE INDEX "containers_companyId_idx" ON "public"."containers"("companyId");

-- CreateIndex
CREATE INDEX "containers_size_idx" ON "public"."containers"("size");

-- CreateIndex
CREATE UNIQUE INDEX "containers_companyId_iso_key" ON "public"."containers"("companyId", "iso");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "public"."jobs"("companyId");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "public"."jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_clientId_idx" ON "public"."jobs"("clientId");

-- CreateIndex
CREATE INDEX "jobs_driverId_idx" ON "public"."jobs"("driverId");

-- CreateIndex
CREATE INDEX "jobs_vehicleId_idx" ON "public"."jobs"("vehicleId");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "public"."jobs"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_company_client_status_idx" ON "public"."jobs"("companyId", "clientId", "status");

-- CreateIndex
CREATE INDEX "jobs_company_driver_status_idx" ON "public"."jobs"("companyId", "driverId", "status");

-- CreateIndex
CREATE INDEX "jobs_company_status_created_idx" ON "public"."jobs"("companyId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "waypoints_jobId_idx" ON "public"."waypoints"("jobId");

-- CreateIndex
CREATE INDEX "waypoints_type_idx" ON "public"."waypoints"("type");

-- CreateIndex
CREATE INDEX "waypoints_sequence_idx" ON "public"."waypoints"("sequence");

-- CreateIndex
CREATE INDEX "location_tracking_jobId_timestamp_idx" ON "public"."location_tracking"("jobId", "timestamp");

-- CreateIndex
CREATE INDEX "location_tracking_driverId_timestamp_idx" ON "public"."location_tracking"("driverId", "timestamp");

-- CreateIndex
CREATE INDEX "location_tracking_timestamp_idx" ON "public"."location_tracking"("timestamp");

-- CreateIndex
CREATE INDEX "location_tracking_driver_latest_idx" ON "public"."location_tracking"("driverId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "location_tracking_job_timestamp_desc_idx" ON "public"."location_tracking"("jobId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "geofences_companyId_isActive_idx" ON "public"."geofences"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "geofence_events_jobId_timestamp_idx" ON "public"."geofence_events"("jobId", "timestamp");

-- CreateIndex
CREATE INDEX "geofence_events_driverId_timestamp_idx" ON "public"."geofence_events"("driverId", "timestamp");

-- CreateIndex
CREATE INDEX "route_waypoints_jobId_sequence_idx" ON "public"."route_waypoints"("jobId", "sequence");

-- CreateIndex
CREATE INDEX "eta_calculations_jobId_createdAt_idx" ON "public"."eta_calculations"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "status_events_jobId_idx" ON "public"."status_events"("jobId");

-- CreateIndex
CREATE INDEX "status_events_code_idx" ON "public"."status_events"("code");

-- CreateIndex
CREATE INDEX "status_events_timestamp_idx" ON "public"."status_events"("timestamp");

-- CreateIndex
CREATE INDEX "status_events_code_timestamp_idx" ON "public"."status_events"("code", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "status_events_job_timestamp_desc_idx" ON "public"."status_events"("jobId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "documents_companyId_idx" ON "public"."documents"("companyId");

-- CreateIndex
CREATE INDEX "documents_jobId_idx" ON "public"."documents"("jobId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "public"."documents"("type");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "public"."documents"("createdAt");

-- CreateIndex
CREATE INDEX "documents_company_type_created_idx" ON "public"."documents"("companyId", "type", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trip_packs_jobId_key" ON "public"."trip_packs"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_packs_qrToken_key" ON "public"."trip_packs"("qrToken");

-- CreateIndex
CREATE INDEX "trip_packs_qrToken_idx" ON "public"."trip_packs"("qrToken");

-- CreateIndex
CREATE INDEX "trip_packs_expiresAt_idx" ON "public"."trip_packs"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "pod_jobId_key" ON "public"."pod"("jobId");

-- CreateIndex
CREATE INDEX "pod_jobId_idx" ON "public"."pod"("jobId");

-- CreateIndex
CREATE INDEX "pod_isComplete_idx" ON "public"."pod"("isComplete");

-- CreateIndex
CREATE INDEX "rate_cards_companyId_idx" ON "public"."rate_cards"("companyId");

-- CreateIndex
CREATE INDEX "rate_cards_clientId_idx" ON "public"."rate_cards"("clientId");

-- CreateIndex
CREATE INDEX "rate_cards_routeId_idx" ON "public"."rate_cards"("routeId");

-- CreateIndex
CREATE INDEX "rate_cards_containerSize_idx" ON "public"."rate_cards"("containerSize");

-- CreateIndex
CREATE INDEX "rate_cards_isActive_idx" ON "public"."rate_cards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "job_economics_jobId_key" ON "public"."job_economics"("jobId");

-- CreateIndex
CREATE INDEX "job_economics_jobId_idx" ON "public"."job_economics"("jobId");

-- CreateIndex
CREATE INDEX "maintenance_events_vehicleId_idx" ON "public"."maintenance_events"("vehicleId");

-- CreateIndex
CREATE INDEX "maintenance_events_serviceType_idx" ON "public"."maintenance_events"("serviceType");

-- CreateIndex
CREATE INDEX "maintenance_events_eventDate_idx" ON "public"."maintenance_events"("eventDate");

-- CreateIndex
CREATE INDEX "maintenance_events_nextServiceDate_idx" ON "public"."maintenance_events"("nextServiceDate");

-- CreateIndex
CREATE INDEX "fuel_records_vehicleId_idx" ON "public"."fuel_records"("vehicleId");

-- CreateIndex
CREATE INDEX "fuel_records_date_idx" ON "public"."fuel_records"("date");

-- CreateIndex
CREATE INDEX "fuel_records_routeClass_idx" ON "public"."fuel_records"("routeClass");

-- CreateIndex
CREATE INDEX "rag_documents_companyId_idx" ON "public"."rag_documents"("companyId");

-- CreateIndex
CREATE INDEX "rag_documents_isProcessed_idx" ON "public"."rag_documents"("isProcessed");

-- CreateIndex
CREATE INDEX "rag_documents_tags_idx" ON "public"."rag_documents"("tags");

-- CreateIndex
CREATE INDEX "rag_chunks_companyId_idx" ON "public"."rag_chunks"("companyId");

-- CreateIndex
CREATE INDEX "rag_chunks_documentId_idx" ON "public"."rag_chunks"("documentId");

-- CreateIndex
CREATE INDEX "rag_chunks_chunkIndex_idx" ON "public"."rag_chunks"("chunkIndex");

-- CreateIndex
CREATE INDEX "usage_meters_companyId_idx" ON "public"."usage_meters"("companyId");

-- CreateIndex
CREATE INDEX "usage_meters_metric_idx" ON "public"."usage_meters"("metric");

-- CreateIndex
CREATE INDEX "usage_meters_period_idx" ON "public"."usage_meters"("period");

-- CreateIndex
CREATE UNIQUE INDEX "usage_meters_companyId_metric_period_key" ON "public"."usage_meters"("companyId", "metric", "period");

-- CreateIndex
CREATE INDEX "job_requests_companyId_idx" ON "public"."job_requests"("companyId");

-- CreateIndex
CREATE INDEX "job_requests_clientId_idx" ON "public"."job_requests"("clientId");

-- CreateIndex
CREATE INDEX "job_requests_status_idx" ON "public"."job_requests"("status");

-- CreateIndex
CREATE INDEX "job_requests_createdAt_idx" ON "public"."job_requests"("createdAt");

-- CreateIndex
CREATE INDEX "job_requests_requestedPickupTs_idx" ON "public"."job_requests"("requestedPickupTs");

-- CreateIndex
CREATE INDEX "job_request_updates_jobRequestId_createdAt_idx" ON "public"."job_request_updates"("jobRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "job_request_updates_updatedBy_idx" ON "public"."job_request_updates"("updatedBy");

-- CreateIndex
CREATE INDEX "job_request_documents_jobRequestId_idx" ON "public"."job_request_documents"("jobRequestId");

-- CreateIndex
CREATE INDEX "job_request_documents_uploadedBy_idx" ON "public"."job_request_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "job_updates_jobId_createdAt_idx" ON "public"."job_updates"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "job_updates_updatedBy_idx" ON "public"."job_updates"("updatedBy");

-- CreateIndex
CREATE INDEX "job_updates_updateType_idx" ON "public"."job_updates"("updateType");

-- CreateIndex
CREATE INDEX "job_updates_severity_idx" ON "public"."job_updates"("severity");

-- CreateIndex
CREATE INDEX "notifications_companyId_idx" ON "public"."notifications"("companyId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_status_idx" ON "public"."notifications"("recipientId", "status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "public"."notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_jobId_idx" ON "public"."notifications"("jobId");

-- CreateIndex
CREATE INDEX "notifications_jobRequestId_idx" ON "public"."notifications"("jobRequestId");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_idx" ON "public"."audit_logs"("companyId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_company_action_timestamp_idx" ON "public"."audit_logs"("companyId", "action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_timestamp_idx" ON "public"."audit_logs"("resource", "resourceId", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bills_jobId_key" ON "public"."bills"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "public"."bills"("billNumber");

-- CreateIndex
CREATE INDEX "bills_companyId_idx" ON "public"."bills"("companyId");

-- CreateIndex
CREATE INDEX "bills_jobId_idx" ON "public"."bills"("jobId");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "public"."bills"("status");

-- CreateIndex
CREATE INDEX "bills_billNumber_idx" ON "public"."bills"("billNumber");

-- CreateIndex
CREATE INDEX "bills_issuedDate_idx" ON "public"."bills"("issuedDate");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."containers" ADD CONSTRAINT "containers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waypoints" ADD CONSTRAINT "waypoints_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."location_tracking" ADD CONSTRAINT "location_tracking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."location_tracking" ADD CONSTRAINT "location_tracking_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."location_tracking" ADD CONSTRAINT "location_tracking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."geofences" ADD CONSTRAINT "geofences_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."geofence_events" ADD CONSTRAINT "geofence_events_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."geofence_events" ADD CONSTRAINT "geofence_events_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "public"."geofences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."geofence_events" ADD CONSTRAINT "geofence_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_waypoints" ADD CONSTRAINT "route_waypoints_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."route_waypoints" ADD CONSTRAINT "route_waypoints_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."eta_calculations" ADD CONSTRAINT "eta_calculations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."status_events" ADD CONSTRAINT "status_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trip_packs" ADD CONSTRAINT "trip_packs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pod" ADD CONSTRAINT "pod_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rate_cards" ADD CONSTRAINT "rate_cards_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rate_cards" ADD CONSTRAINT "rate_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rate_cards" ADD CONSTRAINT "rate_cards_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_economics" ADD CONSTRAINT "job_economics_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_events" ADD CONSTRAINT "maintenance_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fuel_records" ADD CONSTRAINT "fuel_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rag_documents" ADD CONSTRAINT "rag_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rag_chunks" ADD CONSTRAINT "rag_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requests" ADD CONSTRAINT "job_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requests" ADD CONSTRAINT "job_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requests" ADD CONSTRAINT "job_requests_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requests" ADD CONSTRAINT "job_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requests" ADD CONSTRAINT "job_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_request_updates" ADD CONSTRAINT "job_request_updates_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_request_updates" ADD CONSTRAINT "job_request_updates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_request_documents" ADD CONSTRAINT "job_request_documents_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_request_documents" ADD CONSTRAINT "job_request_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_updates" ADD CONSTRAINT "job_updates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_updates" ADD CONSTRAINT "job_updates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_jobUpdateId_fkey" FOREIGN KEY ("jobUpdateId") REFERENCES "public"."job_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

