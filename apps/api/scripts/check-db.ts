import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const jobCount = await prisma.job.count();
    const jobRequestCount = await prisma.jobRequest.count();

    console.log('\n📊 Database Status:');
    console.log(`   Jobs: ${jobCount}`);
    console.log(`   Job Requests: ${jobRequestCount}`);

    if (jobCount > 0) {
      const jobs = await prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true }
      });
      console.log('\n   Recent Jobs:');
      jobs.forEach(job => console.log(`     - ${job.id} (${job.status})`));
    }

    if (jobRequestCount > 0) {
      const requests = await prisma.jobRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, createdAt: true }
      });
      console.log('\n   Recent Job Requests:');
      requests.forEach(req => console.log(`     - ${req.title} (${req.status})`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
