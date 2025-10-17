import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️  Starting data cleanup...');

    // Delete in order of dependencies
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});

    console.log('Deleting audit logs...');
    await prisma.auditLog.deleteMany({});

    console.log('Deleting job updates...');
    await prisma.jobUpdate.deleteMany({});

    console.log('Deleting PODs...');
    await prisma.pOD.deleteMany({});

    console.log('Deleting trip packs...');
    await prisma.tripPack.deleteMany({});

    console.log('Deleting location tracking...');
    await prisma.locationTracking.deleteMany({});

    console.log('Deleting status events...');
    await prisma.statusEvent.deleteMany({});

    console.log('Deleting ETA calculations...');
    await prisma.eTACalculation.deleteMany({});

    console.log('Deleting geofence events...');
    await prisma.geofenceEvent.deleteMany({});

    console.log('Deleting job economics...');
    await prisma.jobEconomics.deleteMany({});

    console.log('Deleting waypoints...');
    await prisma.waypoint.deleteMany({});

    console.log('Deleting job request documents...');
    await prisma.jobRequestDocument.deleteMany({});

    console.log('Deleting job request updates...');
    await prisma.jobRequestUpdate.deleteMany({});

    console.log('Deleting documents...');
    await prisma.document.deleteMany({});

    console.log('Deleting bills...');
    await prisma.bill.deleteMany({});

    console.log('Deleting jobs...');
    await prisma.job.deleteMany({});

    console.log('Deleting job requests...');
    await prisma.jobRequest.deleteMany({});

    console.log('✅ All dummy data cleared successfully!');
    console.log('\n📊 Remaining seed data:');

    const counts = await Promise.all([
      prisma.company.count(),
      prisma.client.count(),
      prisma.driver.count(),
      prisma.vehicle.count(),
      prisma.container.count(),
      prisma.route.count(),
    ]);

    console.log(`   Companies: ${counts[0]}`);
    console.log(`   Clients: ${counts[1]}`);
    console.log(`   Drivers: ${counts[2]}`);
    console.log(`   Vehicles: ${counts[3]}`);
    console.log(`   Containers: ${counts[4]}`);
    console.log(`   Routes: ${counts[5]}`);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
