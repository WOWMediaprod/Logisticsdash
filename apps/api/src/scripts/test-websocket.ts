import { io } from 'socket.io-client';

const COMPANY_ID = 'cmfmbojit0000vj0ch078cnbu';
const API_URL = 'https://logistics-api-d93v.onrender.com';

async function testWebSocket() {
  console.log('🔌 Connecting to WebSocket server...');
  console.log(`URL: ${API_URL}/tracking\n`);

  const socket = io(`${API_URL}/tracking`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server!');
    console.log(`Socket ID: ${socket.id}\n`);

    // Join company tracking room
    console.log(`📡 Joining company tracking room: ${COMPANY_ID}`);
    socket.emit('join-tracking', { companyId: COMPANY_ID });
  });

  socket.on('joined-tracking', (data) => {
    console.log('✅ Successfully joined tracking room!');
    console.log(`Room: ${data.room}`);
    console.log(`Message: ${data.message}\n`);

    // Listen for location updates
    console.log('👂 Listening for real-time updates...\n');
  });

  socket.on('location-update', (update) => {
    console.log('📍 LOCATION UPDATE RECEIVED:');
    console.log(`Job: ${update.data.jobId}`);
    console.log(`Driver: ${update.data.driverId}`);
    console.log(`Position: ${update.data.lat}, ${update.data.lng}`);
    console.log(`Speed: ${update.data.speed} km/h`);
    console.log(`Timestamp: ${update.timestamp}\n`);
  });

  socket.on('live-driver-update', (update) => {
    console.log('🚗 LIVE DRIVER UPDATE RECEIVED:');
    console.log(`Tracker: ${update.data.trackerId}`);
    console.log(`Name: ${update.data.name}`);
    console.log(`Position: ${update.data.lat}, ${update.data.lng}`);
    console.log(`Timestamp: ${update.timestamp}\n`);
  });

  socket.on('job-status-update', (update) => {
    console.log('📦 JOB STATUS UPDATE:');
    console.log(`Job: ${update.data.jobId}`);
    console.log(`Status: ${update.data.status}`);
    console.log(`Timestamp: ${update.timestamp}\n`);
  });

  socket.on('geofence-event', (event) => {
    console.log('🚧 GEOFENCE EVENT:');
    console.log(`Event Type: ${event.data.eventType}`);
    console.log(`Job: ${event.data.jobId}`);
    console.log(`Timestamp: ${event.timestamp}\n`);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Disconnected: ${reason}`);
  });

  // Keep connection alive for 30 seconds
  console.log('⏱️  Keeping connection alive for 30 seconds to listen for updates...\n');

  setTimeout(() => {
    console.log('⏰ Test complete. Closing connection...');
    socket.disconnect();
    process.exit(0);
  }, 30000);
}

testWebSocket().catch(console.error);
