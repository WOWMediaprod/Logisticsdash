import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 Checking test data in database...\n');

  const company = await prisma.company.findFirst({
    where: { id: 'cmfmbojit0000vj0ch078cnbu' }
  });
  console.log(`Company: ${company?.name || 'NOT FOUND'}`);

  const jobs = await prisma.job.findMany({
    where: { companyId: 'cmfmbojit0000vj0ch078cnbu' },
    include: {
      client: { select: { name: true } },
      driver: { select: { name: true } },
      vehicle: { select: { regNo: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\nJobs (${jobs.length}):`);
  jobs.forEach(j => {
    console.log(`- ${j.id}: ${j.status} - Driver: ${j.driver?.name || 'None'} - Vehicle: ${j.vehicle?.regNo || 'None'}`);
  });

  const locations = await prisma.locationTracking.findMany({
    where: { jobId: { in: ['job-test-001', 'job-test-002'] } },
    orderBy: { timestamp: 'desc' },
    take: 5
  });

  console.log(`\nLocation records: ${locations.length}`);
  locations.forEach(l => {
    console.log(`- Job ${l.jobId}: (${l.lat}, ${l.lng}) @ ${l.timestamp.toLocaleString()}`);
  });

  // Check tracking dashboard URL
  console.log('\n🌐 URLs to test:');
  console.log('Dashboard: https://logisticsdash.vercel.app/dashboard/tracking');
  console.log('Driver App (old): https://logisticsdash.vercel.app/driver/job-test-001');
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
