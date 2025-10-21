import { PrismaClient, JobStatus, JobType, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Creating test data for GPS tracking system...');

  try {
    // Create test company
    const company = await prisma.company.upsert({
      where: { id: 'cmfmbojit0000vj0ch078cnbu' },
      update: {},
      create: {
        id: 'cmfmbojit0000vj0ch078cnbu',
        name: 'Test Logistics Co',
        // subdomain: 'testlogistics', // Field doesn't exist in schema
        settings: {
          registrationNo: 'TLC001',
          email: 'test@testlogistics.com',
          phone: '+91-9876543210',
          isActive: true
        }
      }
    });

    // Create test clients
    const client1 = await prisma.client.upsert({
      where: { id: 'client-test-001' },
      update: {},
      create: {
        id: 'client-test-001',
        companyId: company.id,
        name: 'Mumbai Warehouses Ltd',
        code: 'MWL',
        terms: 'NET_30',
        isActive: true
      }
    });

    const client2 = await prisma.client.upsert({
      where: { id: 'client-test-002' },
      update: {},
      create: {
        id: 'client-test-002',
        companyId: company.id,
        name: 'Delhi Distribution Center',
        code: 'DDC',
        terms: 'NET_15',
        isActive: true
      }
    });

    // Create test routes
    const route1 = await prisma.route.upsert({
      where: { id: 'route-test-001' },
      update: {},
      create: {
        id: 'route-test-001',
        companyId: company.id,
        clientId: client1.id,
        code: 'MUM-DEL-001',
        origin: 'Mumbai Port, Mumbai',
        destination: 'Delhi Warehouse, Delhi',
        kmEstimate: 1450,
        isActive: true
      }
    });

    const route2 = await prisma.route.upsert({
      where: { id: 'route-test-002' },
      update: {},
      create: {
        id: 'route-test-002',
        companyId: company.id,
        clientId: client2.id,
        code: 'PUN-BAN-001',
        origin: 'Pune Factory, Pune',
        destination: 'Bangalore Hub, Bangalore',
        kmEstimate: 850,
        isActive: true
      }
    });

    // Create test drivers
    const driver1 = await prisma.driver.upsert({
      where: { id: 'driver-test-001' },
      update: {},
      create: {
        id: 'driver-test-001',
        companyId: company.id,
        name: 'Raj Kumar Singh',
        licenseNo: 'DL123456789',
        phone: '+91-9876543210',
        email: 'raj@testlogistics.com',
        isActive: true
      }
    });

    const driver2 = await prisma.driver.upsert({
      where: { id: 'driver-test-002' },
      update: {},
      create: {
        id: 'driver-test-002',
        companyId: company.id,
        name: 'Suresh Patil',
        licenseNo: 'DL987654321',
        phone: '+91-9876543211',
        email: 'suresh@testlogistics.com',
        isActive: true
      }
    });

    // Create test vehicles
    const vehicle1 = await prisma.vehicle.upsert({
      where: { id: 'vehicle-test-001' },
      update: {},
      create: {
        id: 'vehicle-test-001',
        companyId: company.id,
        regNo: 'MH-01-AB-1234',
        class: 'HEAVY',
        make: 'Tata',
        model: 'Prima 4928.S',
        year: 2022,
        kmpl: 4.5,
        leasePerDay: 2500.00,
        maintPerKm: 8.50,
        currentOdo: 45000,
        isActive: true
      }
    });

    const vehicle2 = await prisma.vehicle.upsert({
      where: { id: 'vehicle-test-002' },
      update: {},
      create: {
        id: 'vehicle-test-002',
        companyId: company.id,
        regNo: 'MH-12-CD-5678',
        class: 'MEDIUM',
        make: 'Ashok Leyland',
        model: 'Dost Plus',
        year: 2023,
        kmpl: 6.2,
        leasePerDay: 1800.00,
        maintPerKm: 6.25,
        currentOdo: 28000,
        isActive: true
      }
    });

    // Create test containers
    const container1 = await prisma.container.upsert({
      where: { id: 'container-test-001' },
      update: {},
      create: {
        id: 'container-test-001',
        companyId: company.id,
        iso: 'TCLU1234567',
        size: '40_HC',
        owner: 'COMPANY_OWNED',
        checkOk: true
      }
    });

    const container2 = await prisma.container.upsert({
      where: { id: 'container-test-002' },
      update: {},
      create: {
        id: 'container-test-002',
        companyId: company.id,
        iso: 'ABCD9876543',
        size: '20_STD',
        owner: 'LEASED',
        checkOk: true
      }
    });

    // Create test jobs
    const job1 = await prisma.job.upsert({
      where: { id: 'job-test-001' },
      update: {},
      create: {
        id: 'job-test-001',
        companyId: company.id,
        clientId: client1.id,
        routeId: route1.id,
        containerId: container1.id,
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        status: JobStatus.IN_TRANSIT,
        jobType: JobType.ONE_WAY,
        priority: Priority.HIGH,
        specialNotes: 'Fragile goods - handle with care'
      }
    });

    const job2 = await prisma.job.upsert({
      where: { id: 'job-test-002' },
      update: {},
      create: {
        id: 'job-test-002',
        companyId: company.id,
        clientId: client2.id,
        routeId: route2.id,
        containerId: container2.id,
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        status: JobStatus.AT_PICKUP,
        jobType: JobType.ONE_WAY,
        priority: Priority.NORMAL,
        specialNotes: 'Scheduled pickup at 10:00 AM'
      }
    });

    // Create route waypoints with coordinates for ETA calculations
    // Route 1: Mumbai to Delhi waypoints
    await prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-mum-del-pickup' },
      update: {},
      create: {
        id: 'waypoint-mum-del-pickup',
        jobId: job1.id,
        routeId: route1.id,
        sequence: 1,
        name: 'Mumbai Port Pickup',
        lat: 19.0760,
        lng: 72.8777,
        type: 'PICKUP'
      }
    });

    await prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-mum-del-delivery' },
      update: {},
      create: {
        id: 'waypoint-mum-del-delivery',
        jobId: job1.id,
        routeId: route1.id,
        sequence: 2,
        name: 'Delhi Warehouse Delivery',
        lat: 28.7041,
        lng: 77.1025,
        type: 'DELIVERY'
      }
    });

    // Route 2: Pune to Bangalore waypoints
    await prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-pun-ban-pickup' },
      update: {},
      create: {
        id: 'waypoint-pun-ban-pickup',
        jobId: job2.id,
        routeId: route2.id,
        sequence: 1,
        name: 'Pune Factory Pickup',
        lat: 18.5204,
        lng: 73.8567,
        type: 'PICKUP'
      }
    });

    await prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-pun-ban-delivery' },
      update: {},
      create: {
        id: 'waypoint-pun-ban-delivery',
        jobId: job2.id,
        routeId: route2.id,
        sequence: 2,
        name: 'Bangalore Hub Delivery',
        lat: 12.9716,
        lng: 77.5946,
        type: 'DELIVERY'
      }
    });

    // Create initial location data for active jobs
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Location data for job 1 (Mumbai - moving towards Delhi)
    await prisma.locationTracking.upsert({
      where: { id: 'location-test-001' },
      update: {},
      create: {
        id: 'location-test-001',
        jobId: job1.id,
        driverId: driver1.id,
        vehicleId: vehicle1.id,
        lat: 19.0760, // Mumbai coordinates
        lng: 72.8777,
        accuracy: 5.0,
        altitude: 14.0,
        speed: 65.0, // km/h
        heading: 45.0, // NE direction towards Delhi
        timestamp: fiveMinutesAgo,
        batteryLevel: 85,
        isManual: false,
        source: 'MOBILE_GPS',
        metadata: {
          userAgent: 'Test GPS Simulator',
          connectionType: '4g'
        }
      }
    });

    // Location data for job 2 (Pune - stationary at pickup)
    await prisma.locationTracking.upsert({
      where: { id: 'location-test-002' },
      update: {},
      create: {
        id: 'location-test-002',
        jobId: job2.id,
        driverId: driver2.id,
        vehicleId: vehicle2.id,
        lat: 18.5204, // Pune coordinates
        lng: 73.8567,
        accuracy: 3.0,
        altitude: 560.0,
        speed: 0.0, // Stationary
        heading: 0.0,
        timestamp: tenMinutesAgo,
        batteryLevel: 92,
        isManual: false,
        source: 'MOBILE_GPS',
        metadata: {
          userAgent: 'Test GPS Simulator',
          connectionType: '4g'
        }
      }
    });

    // Create some geofences for testing
    await prisma.geofence.upsert({
      where: { id: 'geofence-mumbai-port' },
      update: {},
      create: {
        id: 'geofence-mumbai-port',
        companyId: company.id,
        name: 'Mumbai Port Pickup Zone',
        // description: 'Main pickup zone at Mumbai Port', // Field doesn't exist in schema
        type: 'CIRCLE',
        centerLat: 19.0760,
        centerLng: 72.8777,
        radius: 500, // 500 meters
        isActive: true,
        metadata: {
          operatingHours: '06:00-22:00',
          geofenceType: 'PICKUP'
        }
      }
    });

    await prisma.geofence.upsert({
      where: { id: 'geofence-delhi-warehouse' },
      update: {},
      create: {
        id: 'geofence-delhi-warehouse',
        companyId: company.id,
        name: 'Delhi Warehouse Delivery Zone',
        // description: 'Main delivery zone at Delhi Warehouse', // Field doesn't exist in schema
        type: 'CIRCLE',
        centerLat: 28.6139,
        centerLng: 77.2090,
        radius: 300, // 300 meters
        isActive: true,
        metadata: {
          operatingHours: '08:00-20:00',
          geofenceType: 'DELIVERY'
        }
      }
    });

    console.log('✅ Test data created successfully!');
    console.log(`📊 Created:`);
    console.log(`  - Company: ${company.name}`);
    console.log(`  - Clients: ${client1.name}, ${client2.name}`);
    console.log(`  - Routes: ${route1.code}, ${route2.code}`);
    console.log(`  - Drivers: ${driver1.name}, ${driver2.name}`);
    console.log(`  - Vehicles: ${vehicle1.regNo}, ${vehicle2.regNo}`);
    console.log(`  - Jobs: ${job1.id} (${job1.status}), ${job2.id} (${job2.status})`);
    console.log(`  - Location records: 2`);
    console.log(`  - Geofences: 2`);
    console.log('');
    console.log('🌐 You can now:');
    console.log('  1. Visit http://localhost:3000/dashboard/tracking to see live tracking');
    console.log('  2. Visit http://localhost:3000/driver/job-test-001 to simulate driver app');
    console.log('  3. Visit http://localhost:3000/driver/job-test-002 to simulate second driver');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();