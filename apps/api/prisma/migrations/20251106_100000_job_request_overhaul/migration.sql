-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('EXPORT', 'IMPORT', 'LCL');

-- AlterTable
ALTER TABLE "job_requests" ADD COLUMN     "shipmentType" "ShipmentType",
ADD COLUMN     "releaseOrderUrl" TEXT,
ADD COLUMN     "loadingLocation" TEXT,
ADD COLUMN     "loadingLocationLat" DOUBLE PRECISION,
ADD COLUMN     "loadingLocationLng" DOUBLE PRECISION,
ADD COLUMN     "loadingContact" TEXT,
ADD COLUMN     "loadingDate" TIMESTAMP(3),
ADD COLUMN     "loadingTime" TEXT,
ADD COLUMN     "containerReservation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "containerNumber" TEXT,
ADD COLUMN     "sealNumber" TEXT,
ADD COLUMN     "containerYardLocation" TEXT,
ADD COLUMN     "containerYardLocationLat" DOUBLE PRECISION,
ADD COLUMN     "containerYardLocationLng" DOUBLE PRECISION,
ADD COLUMN     "cargoWeight" DECIMAL(10,2),
ADD COLUMN     "cargoWeightUnit" TEXT DEFAULT 'kg',
ADD COLUMN     "blCutoffRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blCutoffDateTime" TIMESTAMP(3),
ADD COLUMN     "wharfName" TEXT,
ADD COLUMN     "wharfContact" TEXT,
ADD COLUMN     "deliveryContact" TEXT;

-- CreateIndex
CREATE INDEX "job_requests_shipmentType_idx" ON "job_requests"("shipmentType");

-- CreateIndex
CREATE INDEX "job_requests_loadingDate_idx" ON "job_requests"("loadingDate");
