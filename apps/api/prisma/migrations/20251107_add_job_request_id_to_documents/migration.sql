-- AlterTable: Add jobRequestId to documents table to link documents with job requests
ALTER TABLE "documents" ADD COLUMN "jobRequestId" TEXT;

-- CreateIndex: Add index on jobRequestId for better query performance
CREATE INDEX "documents_jobRequestId_idx" ON "documents"("jobRequestId");

-- AddForeignKey: Link documents to job requests
ALTER TABLE "documents" ADD CONSTRAINT "documents_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "job_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
