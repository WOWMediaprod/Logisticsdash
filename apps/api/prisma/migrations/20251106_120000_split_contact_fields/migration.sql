-- AlterTable: Split loadingContact into loadingContactName and loadingContactPhone
ALTER TABLE "job_requests" ADD COLUMN "loadingContactName" TEXT;
ALTER TABLE "job_requests" ADD COLUMN "loadingContactPhone" TEXT;

-- AlterTable: Split deliveryContact into deliveryContactName and deliveryContactPhone
ALTER TABLE "job_requests" ADD COLUMN "deliveryContactName" TEXT;
ALTER TABLE "job_requests" ADD COLUMN "deliveryContactPhone" TEXT;

-- Drop old combined fields (optional - can be done in a future migration after data migration)
-- ALTER TABLE "job_requests" DROP COLUMN "loadingContact";
-- ALTER TABLE "job_requests" DROP COLUMN "deliveryContact";
