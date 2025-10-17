-- CreateEnum
CREATE TYPE "JobRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOB_REQUEST_SUBMITTED', 'JOB_REQUEST_REVIEWED', 'JOB_REQUEST_ACCEPTED', 'JOB_REQUEST_DECLINED', 'JOB_ASSIGNED', 'JOB_STARTED', 'JOB_UPDATE', 'JOB_COMPLETED', 'JOB_DELAYED', 'JOB_EMERGENCY', 'ETA_UPDATED', 'DOCUMENT_UPLOADED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "job_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
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
    "status" "JobRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "jobId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_request_updates" (
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
CREATE TABLE "job_request_documents" (
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
CREATE TABLE "job_updates" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus",
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
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'USER',
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "jobId" TEXT,
    "jobRequestId" TEXT,
    "jobUpdateId" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "channels" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_requests_companyId_idx" ON "job_requests"("companyId");

-- CreateIndex
CREATE INDEX "job_requests_clientId_idx" ON "job_requests"("clientId");

-- CreateIndex
CREATE INDEX "job_requests_status_idx" ON "job_requests"("status");

-- CreateIndex
CREATE INDEX "job_requests_createdAt_idx" ON "job_requests"("createdAt");

-- CreateIndex
CREATE INDEX "job_requests_requestedPickupTs_idx" ON "job_requests"("requestedPickupTs");

-- CreateIndex
CREATE INDEX "job_request_updates_jobRequestId_createdAt_idx" ON "job_request_updates"("jobRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "job_request_updates_updatedBy_idx" ON "job_request_updates"("updatedBy");

-- CreateIndex
CREATE INDEX "job_request_documents_jobRequestId_idx" ON "job_request_documents"("jobRequestId");

-- CreateIndex
CREATE INDEX "job_request_documents_uploadedBy_idx" ON "job_request_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "job_updates_jobId_createdAt_idx" ON "job_updates"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "job_updates_updatedBy_idx" ON "job_updates"("updatedBy");

-- CreateIndex
CREATE INDEX "job_updates_updateType_idx" ON "job_updates"("updateType");

-- CreateIndex
CREATE INDEX "job_updates_severity_idx" ON "job_updates"("severity");

-- CreateIndex
CREATE INDEX "notifications_companyId_idx" ON "notifications"("companyId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_status_idx" ON "notifications"("recipientId", "status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_jobId_idx" ON "notifications"("jobId");

-- CreateIndex
CREATE INDEX "notifications_jobRequestId_idx" ON "notifications"("jobRequestId");

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_request_updates" ADD CONSTRAINT "job_request_updates_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_request_updates" ADD CONSTRAINT "job_request_updates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_request_documents" ADD CONSTRAINT "job_request_documents_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_request_documents" ADD CONSTRAINT "job_request_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_updates" ADD CONSTRAINT "job_updates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_updates" ADD CONSTRAINT "job_updates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_jobUpdateId_fkey" FOREIGN KEY ("jobUpdateId") REFERENCES "job_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;