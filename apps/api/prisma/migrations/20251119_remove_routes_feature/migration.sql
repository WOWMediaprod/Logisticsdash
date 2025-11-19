-- AlterTable: Remove routeId from jobs table
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "routeId";

-- AlterTable: Remove routeId from job_requests table
ALTER TABLE "job_requests" DROP COLUMN IF EXISTS "routeId";

-- AlterTable: Remove routeId from rate_cards table
ALTER TABLE "rate_cards" DROP COLUMN IF EXISTS "routeId";

-- DropIndex: Remove route-related indexes
DROP INDEX IF EXISTS "rate_cards_routeId_idx";
DROP INDEX IF EXISTS "job_requests_routeId_idx";

-- DropTable: Drop route_waypoints table (CASCADE will be handled by FK)
DROP TABLE IF EXISTS "route_waypoints" CASCADE;

-- DropTable: Drop routes table
DROP TABLE IF EXISTS "routes" CASCADE;
