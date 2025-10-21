import { PrismaClient, Role, JobStatus, JobType, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-001' },
    update: {},
    create: {
      id: 'demo-company-001',
      name: 'Demo Logistics Company',
      // subdomain: 'demo-logistics', // Field doesn't exist in schema
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        businessHours: { start: '09:00', end: '18:00' }
      },
    },
  });

  console.log(`✅ Company created: ${company.name}`);

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      // password: 'hashed_password', // Field doesn't exist in schema - use external auth
      role: Role.ADMIN,
      firstName: 'John',
      lastName: 'Admin',
      companyId: company.id,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@demo.com' },
    update: {},
    create: {
      email: 'dispatcher@demo.com',
      // password: 'hashed_password', // Field doesn't exist in schema - use external auth
      role: Role.DISPATCHER,
      firstName: 'Sarah',
      lastName: 'Dispatcher',
      companyId: company.id,
    },
  });

  console.log('✅ Users created');

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-1' },
      update: {},
      create: {
        id: 'client-1',
        companyId: company.id,
        name: 'Mumbai Port Trust',
        code: 'MPT',
        terms: 'Net 30',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-2' },
      update: {},
      create: {
        id: 'client-2',
        companyId: company.id,
        name: 'JNPT Container Terminal',
        code: 'JNPT',
        terms: 'Net 15',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-3' },
      update: {},
      create: {
        id: 'client-3',
        companyId: company.id,
        name: 'Adani Logistics',
        code: 'ADANI',
        terms: 'Net 30',
      },
    }),
  ]);

  console.log('✅ Clients created');

  // Create demo routes
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { code: 'MUM-DEL' },
      update: {},
      create: {
        companyId: company.id,
        clientId: clients[0].id,
        code: 'MUM-DEL',
        origin: 'Mumbai Port',
        destination: 'Delhi ICD',
        kmEstimate: 1450,
      },
    }),
    prisma.route.upsert({
      where: { code: 'JNPT-PUN' },
      update: {},
      create: {
        companyId: company.id,
        clientId: clients[1].id,
        code: 'JNPT-PUN',
        origin: 'JNPT Terminal',
        destination: 'Pune Industrial Area',
        kmEstimate: 150,
      },
    }),
    prisma.route.upsert({
      where: { code: 'MUM-BLR' },
      update: {},
      create: {
        companyId: company.id,
        clientId: clients[2].id,
        code: 'MUM-BLR',
        origin: 'Mumbai Port',
        destination: 'Bangalore ICD',
        kmEstimate: 840,
      },
    }),
  ]);

  console.log('✅ Routes created');

  // Create demo vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { id: 'vehicle-1' },
      update: {},
      create: {
        id: 'vehicle-1',
        companyId: company.id,
        regNo: 'MH12AB1234',
        class: 'Heavy Truck',
        make: 'Tata',
        model: 'Prima 4940',
        year: 2022,
        kmpl: 6.5,
        leasePerDay: 8500.00,
        maintPerKm: 2.50,
        currentOdo: 85000,
      },
    }),
    prisma.vehicle.upsert({
      where: { id: 'vehicle-2' },
      update: {},
      create: {
        id: 'vehicle-2',
        companyId: company.id,
        regNo: 'MH14CD5678',
        class: 'Medium Truck',
        make: 'Ashok Leyland',
        model: 'Ecomet 1615',
        year: 2021,
        kmpl: 8.2,
        leasePerDay: 6500.00,
        maintPerKm: 2.10,
        currentOdo: 120000,
      },
    }),
    prisma.vehicle.upsert({
      where: { id: 'vehicle-3' },
      update: {},
      create: {
        id: 'vehicle-3',
        companyId: company.id,
        regNo: 'KA05EF9012',
        class: 'Heavy Truck',
        make: 'Mahindra',
        model: 'Blazo X 49',
        year: 2023,
        kmpl: 7.1,
        leasePerDay: 9200.00,
        maintPerKm: 2.30,
        currentOdo: 42000,
      },
    }),
  ]);

  console.log('✅ Vehicles created');

  // Create demo drivers
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { id: 'driver-1' },
      update: {},
      create: {
        id: 'driver-1',
        companyId: company.id,
        name: 'Rajesh Kumar',
        licenseNo: 'MH1234567890',
        phone: '+91-9876543210',
        email: 'rajesh.driver@demo.com',
      },
    }),
    prisma.driver.upsert({
      where: { id: 'driver-2' },
      update: {},
      create: {
        id: 'driver-2',
        companyId: company.id,
        name: 'Suresh Patil',
        licenseNo: 'MH0987654321',
        phone: '+91-9876543211',
        email: 'suresh.driver@demo.com',
      },
    }),
    prisma.driver.upsert({
      where: { id: 'driver-3' },
      update: {},
      create: {
        id: 'driver-3',
        companyId: company.id,
        name: 'Ramesh Singh',
        licenseNo: 'KA1122334455',
        phone: '+91-9876543212',
        email: 'ramesh.driver@demo.com',
      },
    }),
  ]);

  console.log('✅ Drivers created');

  // Create demo containers
  const containers = await Promise.all([
    prisma.container.upsert({
      where: { id: 'container-1' },
      update: {},
      create: {
        id: 'container-1',
        companyId: company.id,
        iso: 'MSKU9070707',
        size: '40HC',
        owner: 'MSK',
        checkOk: true,
      },
    }),
    prisma.container.upsert({
      where: { id: 'container-2' },
      update: {},
      create: {
        id: 'container-2',
        companyId: company.id,
        iso: 'CSNU3054383',
        size: '20ft',
        owner: 'COSCO',
        checkOk: true,
      },
    }),
    prisma.container.upsert({
      where: { id: 'container-3' },
      update: {},
      create: {
        id: 'container-3',
        companyId: company.id,
        iso: 'HHLU8760543',
        size: '40ft',
        owner: 'HHL',
        checkOk: false,
      },
    }),
  ]);

  console.log('✅ Containers created');

  // Create demo jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        companyId: company.id,
        clientId: clients[0].id,
        routeId: routes[0].id,
        containerId: containers[0].id,
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        assignedBy: admin.id,
        status: JobStatus.IN_TRANSIT,
        jobType: JobType.ONE_WAY,
        priority: Priority.HIGH,
        pickupTs: new Date('2025-09-16T08:00:00Z'),
        etaTs: new Date('2025-09-17T14:00:00Z'),
        specialNotes: 'Handle with care - fragile cargo',
      },
    }),
    prisma.job.create({
      data: {
        companyId: company.id,
        clientId: clients[1].id,
        routeId: routes[1].id,
        containerId: containers[1].id,
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        assignedBy: dispatcher.id,
        status: JobStatus.ASSIGNED,
        jobType: JobType.ROUND_TRIP,
        priority: Priority.NORMAL,
        pickupTs: new Date('2025-09-16T14:00:00Z'),
        etaTs: new Date('2025-09-16T18:00:00Z'),
        specialNotes: 'Return container to depot after delivery',
      },
    }),
    prisma.job.create({
      data: {
        companyId: company.id,
        clientId: clients[2].id,
        routeId: routes[2].id,
        containerId: containers[2].id,
        status: JobStatus.CREATED,
        jobType: JobType.ONE_WAY,
        priority: Priority.URGENT,
        pickupTs: new Date('2025-09-17T06:00:00Z'),
        specialNotes: 'Needs immediate assignment - time sensitive cargo',
      },
    }),
    prisma.job.create({
      data: {
        companyId: company.id,
        clientId: clients[0].id,
        routeId: routes[0].id,
        vehicleId: vehicles[2].id,
        driverId: drivers[2].id,
        assignedBy: admin.id,
        status: JobStatus.COMPLETED,
        jobType: JobType.ONE_WAY,
        priority: Priority.NORMAL,
        pickupTs: new Date('2025-09-14T09:00:00Z'),
        dropTs: new Date('2025-09-15T15:30:00Z'),
        specialNotes: 'Successfully delivered on time',
      },
    }),
    prisma.job.create({
      data: {
        companyId: company.id,
        clientId: clients[1].id,
        status: JobStatus.CREATED,
        jobType: JobType.MULTI_STOP,
        priority: Priority.LOW,
        specialNotes: 'Multi-stop delivery - requires planning',
      },
    }),
  ]);

  console.log('✅ Jobs created');

  // Create status events for the active jobs
  await Promise.all([
    prisma.statusEvent.create({
      data: {
        jobId: jobs[0].id,
        code: 'JOB_ASSIGNED',
        note: 'Job assigned to Rajesh Kumar with vehicle MH12AB1234',
        source: 'MANUAL',
      },
    }),
    prisma.statusEvent.create({
      data: {
        jobId: jobs[0].id,
        code: 'PICKUP_COMPLETE',
        note: 'Container picked up from Mumbai Port',
        lat: 18.9647,
        lng: 72.8258,
        source: 'GEOFENCE',
      },
    }),
    prisma.statusEvent.create({
      data: {
        jobId: jobs[1].id,
        code: 'JOB_ASSIGNED',
        note: 'Job assigned to Suresh Patil with vehicle MH14CD5678',
        source: 'MANUAL',
      },
    }),
  ]);

  console.log('✅ Status events created');

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   • 1 Company (${company.name})`);
  console.log(`   • 2 Users (Admin & Dispatcher)`);
  console.log(`   • 3 Clients`);
  console.log(`   • 3 Routes`);
  console.log(`   • 3 Vehicles`);
  console.log(`   • 3 Drivers`);
  console.log(`   • 3 Containers`);
  console.log(`   • 5 Jobs (various statuses)`);
  console.log(`   • Status events for tracking`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });