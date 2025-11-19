import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🇱🇰 Seeding database with Sri Lankan data...');

  // Create Company
  const company = await prisma.company.upsert({
    where: { id: 'cmfmbojit0000vj0ch078cnbu' },
    update: {},
    create: {
      id: 'cmfmbojit0000vj0ch078cnbu',
      name: 'Lanka Logistics',
      settings: {},
    },
  });
  console.log('✅ Company created:', company.name);

  // Create Clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-001' },
      update: {},
      create: {
        id: 'client-001',
        code: 'CARGILLS',
        name: 'Cargills Ceylon PLC',
        companyId: company.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-002' },
      update: {},
      create: {
        id: 'client-002',
        code: 'KEELLS',
        name: 'John Keells Holdings',
        companyId: company.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-003' },
      update: {},
      create: {
        id: 'client-003',
        code: 'AITKEN',
        name: 'Aitken Spence Logistics',
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Clients created:', clients.length);

  // Create Drivers
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { id: 'driver-001' },
      update: {},
      create: {
        id: 'driver-001',
        name: 'Saman Kumara',
        licenseNo: 'B1234567',
        phone: '+94771234567',
        email: 'saman.kumara@lankalogistics.lk',
        pin: '1111',
        companyId: company.id,
      },
    }),
    prisma.driver.upsert({
      where: { id: 'driver-002' },
      update: {},
      create: {
        id: 'driver-002',
        name: 'Nimal Perera',
        licenseNo: 'B2345678',
        phone: '+94772345678',
        email: 'nimal.perera@lankalogistics.lk',
        pin: '2222',
        companyId: company.id,
      },
    }),
    prisma.driver.upsert({
      where: { id: 'driver-003' },
      update: {},
      create: {
        id: 'driver-003',
        name: 'Chaminda Silva',
        licenseNo: 'B3456789',
        phone: '+94773456789',
        email: 'chaminda.silva@lankalogistics.lk',
        pin: '3333',
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Drivers created:', drivers.length);

  // Create Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { id: 'vehicle-001' },
      update: {},
      create: {
        id: 'vehicle-001',
        regNo: 'WP CAB-1234',
        class: 'TRUCK',
        make: 'Tata',
        model: 'LPT 1613',
        year: 2022,
        companyId: company.id,
      },
    }),
    prisma.vehicle.upsert({
      where: { id: 'vehicle-002' },
      update: {},
      create: {
        id: 'vehicle-002',
        regNo: 'WP CAC-5678',
        class: 'TRUCK',
        make: 'Ashok Leyland',
        model: 'Ecomet 1015',
        year: 2023,
        companyId: company.id,
      },
    }),
    prisma.vehicle.upsert({
      where: { id: 'vehicle-003' },
      update: {},
      create: {
        id: 'vehicle-003',
        regNo: 'WP CAD-9012',
        class: 'VAN',
        make: 'Isuzu',
        model: 'Elf',
        year: 2021,
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Vehicles created:', vehicles.length);

  // Create Jobs
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'job-lk-001' },
      update: {},
      create: {
        id: 'job-lk-001',
        status: 'IN_TRANSIT',
        clientId: clients[0].id,
        driverId: drivers[0].id,
        vehicleId: vehicles[0].id,
        companyId: company.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'job-lk-002' },
      update: {},
      create: {
        id: 'job-lk-002',
        status: 'AT_PICKUP',
        clientId: clients[1].id,
        driverId: drivers[1].id,
        vehicleId: vehicles[1].id,
        companyId: company.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'job-lk-003' },
      update: {},
      create: {
        id: 'job-lk-003',
        status: 'LOADED',
        clientId: clients[2].id,
        driverId: drivers[2].id,
        vehicleId: vehicles[2].id,
        companyId: company.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'job-lk-004' },
      update: {},
      create: {
        id: 'job-lk-004',
        status: 'ASSIGNED',
        clientId: clients[0].id,
        driverId: drivers[0].id,
        vehicleId: vehicles[0].id,
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Jobs created:', jobs.length);

  console.log('🎉 Sri Lankan test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/*
  // Create Route Waypoints (skipped for now)
  await Promise.all([
    // Job 1: Colombo to Kandy
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-001-pickup' },
      update: {},
      create: {
        id: 'waypoint-001-pickup',
        jobId: jobs[0].id,
        name: 'Cargills Warehouse - Colombo',
        type: 'PICKUP',
        lat: '6.9271',
        lng: '79.8612',
        sequence: 1,
        address: '40 York Street, Colombo 01',
      },
    }),
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-001-delivery' },
      update: {},
      create: {
        id: 'waypoint-001-delivery',
        jobId: jobs[0].id,
        name: 'Cargills Distribution - Kandy',
        type: 'DELIVERY',
        lat: '7.2906',
        lng: '80.6337',
        sequence: 2,
        address: 'Peradeniya Road, Kandy',
      },
    }),

    // Job 2: Colombo to Galle
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-002-pickup' },
      update: {},
      create: {
        id: 'waypoint-002-pickup',
        jobId: jobs[1].id,
        name: 'Keells Warehouse - Colombo',
        type: 'PICKUP',
        lat: '6.9147',
        lng: '79.8731',
        sequence: 1,
        address: '130 Glennie Street, Colombo 02',
      },
    }),
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-002-delivery' },
      update: {},
      create: {
        id: 'waypoint-002-delivery',
        jobId: jobs[1].id,
        name: 'Keells Super - Galle',
        type: 'DELIVERY',
        lat: '6.0329',
        lng: '80.2168',
        sequence: 2,
        address: 'Main Street, Galle',
      },
    }),

    // Job 3: Kandy to Jaffna
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-003-pickup' },
      update: {},
      create: {
        id: 'waypoint-003-pickup',
        jobId: jobs[2].id,
        name: 'Aitken Spence - Kandy',
        type: 'PICKUP',
        lat: '7.2906',
        lng: '80.6337',
        sequence: 1,
        address: 'Dalada Veediya, Kandy',
      },
    }),
    prisma.routeWaypoint.upsert({
      where: { id: 'waypoint-003-delivery' },
      update: {},
      create: {
        id: 'waypoint-003-delivery',
        jobId: jobs[2].id,
        name: 'Aitken Spence - Jaffna',
        type: 'DELIVERY',
        lat: '9.6615',
        lng: '80.0255',
        sequence: 2,
        address: 'Hospital Road, Jaffna',
      },
    }),
  ]);
  console.log('✅ Waypoints created');

  // Create some GPS tracking data
  const now = new Date();
  await Promise.all([
    // Saman driving to Kandy (currently near Kadugannawa)
    prisma.locationTracking.create({
      data: {
        jobId: jobs[0].id,
        driverId: drivers[0].id,
        vehicleId: vehicles[0].id,
        lat: '7.2536',
        lng: '80.5219',
        accuracy: 10,
        speed: 45,
        heading: 45,
        timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        source: 'MOBILE_GPS',
      },
    }),

    // Nimal at Cargills warehouse in Colombo
    prisma.locationTracking.create({
      data: {
        jobId: jobs[1].id,
        driverId: drivers[1].id,
        vehicleId: vehicles[1].id,
        lat: '6.9147',
        lng: '79.8731',
        accuracy: 8,
        speed: 0,
        heading: 0,
        timestamp: new Date(now.getTime() - 1 * 60 * 1000), // 1 minute ago
        source: 'MOBILE_GPS',
      },
    }),

    // Chaminda heading north on A9 highway
    prisma.locationTracking.create({
      data: {
        jobId: jobs[2].id,
        driverId: drivers[2].id,
        vehicleId: vehicles[2].id,
        lat: '8.3114',
        lng: '80.4037',
        accuracy: 12,
        speed: 60,
        heading: 0,
        timestamp: new Date(now.getTime() - 3 * 60 * 1000), // 3 minutes ago
        source: 'MOBILE_GPS',
      },
    }),
  ]);
  console.log('✅ GPS tracking data created');

  console.log('🎉 Sri Lankan test data seeded successfully!');
}
*/
