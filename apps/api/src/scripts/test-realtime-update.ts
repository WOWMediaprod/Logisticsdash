import { io } from 'socket.io-client';

const COMPANY_ID = 'cmfmbojit0000vj0ch078cnbu';
const API_URL = 'https://logistics-api-d93v.onrender.com';

async function testRealtimeUpdate() {
  console.log('🧪 Testing Real-time Location Updates\n');

  // Create a listener client (dashboard)
  const dashboardSocket = io(`${API_URL}/tracking`, {
    transports: ['websocket', 'polling'],
  });

  // Create a sender client (driver app)
  const driverSocket = io(`${API_URL}/tracking`, {
    transports: ['websocket', 'polling'],
  });

  let updateReceived = false;

  dashboardSocket.on('connect', () => {
    console.log('📊 Dashboard connected:', dashboardSocket.id);
    dashboardSocket.emit('join-tracking', { companyId: COMPANY_ID });
  });

  dashboardSocket.on('joined-tracking', () => {
    console.log('✅ Dashboard joined tracking room\n');

    // Listen for location updates
    dashboardSocket.on('location-update', (update) => {
      console.log('🎉 REAL-TIME UPDATE RECEIVED BY DASHBOARD!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Job ID: ${update.data.jobId}`);
      console.log(`Driver: ${update.data.driverId}`);
      console.log(`Location: ${update.data.lat}, ${update.data.lng}`);
      console.log(`Speed: ${update.data.speed} km/h`);
      console.log(`Heading: ${update.data.heading}°`);
      console.log(`Timestamp: ${update.timestamp}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      updateReceived = true;

      // Wait a moment then close
      setTimeout(() => {
        console.log('✅ Real-time update test PASSED!\n');
        dashboardSocket.disconnect();
        driverSocket.disconnect();
        process.exit(0);
      }, 1000);
    });
  });

  driverSocket.on('connect', () => {
    console.log('📱 Driver app connected:', driverSocket.id);

    // Wait a moment for dashboard to join room
    setTimeout(() => {
      console.log('\n📍 Sending location update from driver...\n');

      driverSocket.emit('location-update', {
        jobId: 'job-test-001',
        driverId: 'driver-test-001',
        lat: 28.7041,
        lng: 77.1025,
        speed: 45,
        heading: 90,
        timestamp: new Date().toISOString(),
        accuracy: 5.0,
      });
    }, 2000);
  });

  driverSocket.on('location-update-ack', (ack) => {
    if (ack.success) {
      console.log('✅ Location update acknowledged by server');
      console.log('⏳ Waiting for real-time broadcast...\n');
    } else {
      console.error('❌ Location update failed:', ack.error);
    }
  });

  // Timeout if no update received
  setTimeout(() => {
    if (!updateReceived) {
      console.log('❌ No real-time update received within 10 seconds');
      console.log('This could mean:');
      console.log('  - WebSocket broadcast is not working');
      console.log('  - Rooms are not properly configured');
      console.log('  - Location update was not processed\n');
    }
    process.exit(updateReceived ? 0 : 1);
  }, 10000);
}

testRealtimeUpdate().catch(console.error);
