import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testETACalculations() {
  console.log('🚀 Testing ETA calculations...');

  try {
    // Test location updates that should trigger ETA calculations
    const testLocations = [
      {
        jobId: 'job-test-001',
        driverId: 'driver-test-001',
        vehicleId: 'vehicle-test-001',
        lat: 19.2183, // Slightly further north from Mumbai
        lng: 72.9781,
        accuracy: 5.0,
        speed: 70.0,
        heading: 45.0,
        timestamp: new Date(),
        batteryLevel: 80,
        source: 'MOBILE_GPS'
      },
      {
        jobId: 'job-test-002',
        driverId: 'driver-test-002',
        vehicleId: 'vehicle-test-002',
        lat: 18.5304, // Slightly moved from pickup location
        lng: 73.8667,
        accuracy: 3.0,
        speed: 0.0,
        heading: 0.0,
        timestamp: new Date(),
        batteryLevel: 95,
        source: 'MOBILE_GPS'
      }
    ];

    // Simulate location updates via API call
    for (const location of testLocations) {
      console.log(`📍 Sending location update for job ${location.jobId}...`);

      const response = await fetch('http://localhost:3004/api/v1/tracking/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Location updated successfully:`, result);
      } else {
        console.log(`❌ Failed to update location:`, response.status, await response.text());
      }
    }

    // Check ETA calculations were created
    console.log('\n📊 Checking ETA calculations...');
    const etaCalculations = await prisma.eTACalculation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        job: {
          select: { id: true, status: true, etaTs: true }
        }
      }
    });

    console.log(`Found ${etaCalculations.length} ETA calculations:`);
    etaCalculations.forEach((eta, index) => {
      console.log(`${index + 1}. Job ${eta.jobId}:`);
      console.log(`   - ETA: ${eta.estimatedTimeMinutes} minutes`);
      console.log(`   - Distance: ${eta.estimatedDistance}m`);
      console.log(`   - Method: ${eta.calculationMethod}`);
      console.log(`   - Confidence: ${eta.confidence}`);
      console.log(`   - Job ETA timestamp: ${eta.job.etaTs}`);
      console.log(`   - Created: ${eta.createdAt}`);
      console.log('');
    });

    // Check latest location tracking records
    console.log('📍 Latest location tracking records:');
    const locations = await prisma.locationTracking.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        job: { select: { id: true, status: true, etaTs: true } },
        driver: { select: { name: true } }
      }
    });

    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.driver.name} (Job ${loc.jobId}):`);
      console.log(`   - Location: ${loc.lat}, ${loc.lng}`);
      console.log(`   - Speed: ${loc.speed} km/h`);
      console.log(`   - Timestamp: ${loc.timestamp}`);
      console.log(`   - Job ETA: ${loc.job.etaTs}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing ETA calculations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testETACalculations().catch(console.error);