import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simulate route: Mumbai to Delhi
const route = [
  { lat: 19.0760, lng: 72.8777, location: 'Mumbai Port' },
  { lat: 19.2183, lng: 72.9781, location: 'Thane' },
  { lat: 19.9975, lng: 73.7898, location: 'Nasik' },
  { lat: 21.1458, lng: 79.0882, location: 'Nagpur' },
  { lat: 23.1765, lng: 79.9449, location: 'Jabalpur' },
  { lat: 25.4358, lng: 81.8463, location: 'Allahabad' },
  { lat: 26.8467, lng: 80.9462, location: 'Lucknow' },
  { lat: 28.7041, lng: 77.1025, location: 'Delhi' },
];

async function simulateMovement() {
  console.log('🚚 Simulating driver movement from Mumbai to Delhi...\n');

  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    const speed = i < route.length - 1 ? 60 : 0; // 60 km/h, stop at destination

    await prisma.locationTracking.create({
      data: {
        jobId: 'job-test-001',
        driverId: 'driver-test-001',
        vehicleId: 'vehicle-test-001',
        lat: point.lat,
        lng: point.lng,
        accuracy: 5.0,
        speed,
        heading: i < route.length - 1 ? 45 : 0, // NE direction
        timestamp: new Date(),
        batteryLevel: 85 - i * 5,
        source: 'MOBILE_GPS',
        metadata: {
          location: point.location,
          simulated: true,
        },
      },
    });

    console.log(`✅ ${i + 1}/${route.length} - ${point.location} (${point.lat}, ${point.lng})`);

    // Wait 2 seconds between updates
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 Simulation complete! Check the tracking dashboard.');
  console.log('Dashboard: https://logisticsdash.vercel.app/dashboard/tracking');
}

simulateMovement()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
