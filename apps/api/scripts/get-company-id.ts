import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCompanyId() {
  try {
    // Get first company (subdomain field doesn't exist in schema)
    const company = await prisma.company.findFirst();

    if (company) {
      console.log('Company ID:', company.id);
      console.log('Company Name:', company.name);
    } else {
      console.log('No company found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCompanyId();