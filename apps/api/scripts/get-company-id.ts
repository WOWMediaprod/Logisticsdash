import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCompanyId() {
  try {
    const company = await prisma.company.findFirst({
      where: { subdomain: 'demo-logistics' }
    });

    if (company) {
      console.log('Demo Company ID:', company.id);
      console.log('Company Name:', company.name);
    } else {
      console.log('No demo company found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCompanyId();