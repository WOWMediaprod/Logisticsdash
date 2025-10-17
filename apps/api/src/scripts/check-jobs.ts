import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobs() {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        status: true,
        client: { select: { name: true } },
        driver: { select: { name: true } },
        route: {
          select: {
            origin: true,
            destination: true
          }
        }
      },
      take: 10
    });

    console.log(`Found ${jobs.length} jobs:`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ID: ${job.id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Client: ${job.client?.name || 'N/A'}`);
      console.log(`   Driver: ${job.driver?.name || 'N/A'}`);
      console.log(`   Route: ${job.route?.origin || 'N/A'} → ${job.route?.destination || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJobs().catch(console.error);