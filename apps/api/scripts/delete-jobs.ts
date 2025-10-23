import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllJobs() {
  try {
    console.log('Starting deletion of all jobs...');

    // Delete in correct order to respect foreign key constraints
    console.log('Deleting waypoints...');
    const waypointsResult = await prisma.waypoint.deleteMany({});
    console.log(`Deleted ${waypointsResult.count} waypoints`);

    console.log('Deleting status events...');
    const statusEventsResult = await prisma.statusEvent.deleteMany({});
    console.log(`Deleted ${statusEventsResult.count} status events`);

    console.log('Deleting bills...');
    const billsResult = await prisma.bill.deleteMany({});
    console.log(`Deleted ${billsResult.count} bills`);

    console.log('Deleting job requests...');
    const jobRequestsResult = await prisma.jobRequest.deleteMany({});
    console.log(`Deleted ${jobRequestsResult.count} job requests`);

    console.log('Deleting jobs...');
    const jobsResult = await prisma.job.deleteMany({});
    console.log(`Deleted ${jobsResult.count} jobs`);

    console.log('✅ All jobs and related data deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllJobs();
