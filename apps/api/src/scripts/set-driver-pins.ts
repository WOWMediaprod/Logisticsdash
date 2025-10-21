import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setDriverPins() {
  console.log('🔐 Setting driver PINs for testing...');

  try {
    // Set PIN for Driver 1 - Raj Kumar Singh (plain text for testing)
    const pin1 = '1234';

    await prisma.driver.update({
      where: { id: 'driver-test-001' },
      data: { pin: pin1 }
    });
    console.log(`✅ Driver 1 (Raj Kumar Singh) PIN set to: ${pin1}`);

    // Set PIN for Driver 2 - Suresh Patil (plain text for testing)
    const pin2 = '5678';

    await prisma.driver.update({
      where: { id: 'driver-test-002' },
      data: { pin: pin2 }
    });
    console.log(`✅ Driver 2 (Suresh Patil) PIN set to: ${pin2}`);

    console.log('\n📱 You can now log in:');
    console.log('Driver 1: https://logisticsdash.vercel.app/driver/job-test-001');
    console.log('PIN: 1234');
    console.log('\nDriver 2: https://logisticsdash.vercel.app/driver/job-test-002');
    console.log('PIN: 5678');

  } catch (error) {
    console.error('❌ Error setting PINs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setDriverPins();
