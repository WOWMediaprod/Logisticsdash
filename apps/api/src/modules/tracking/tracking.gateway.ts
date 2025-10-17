import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TrackingService } from './tracking.service';

const LAN_ORIGIN_REGEX = /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/;
const NGROK_ORIGIN_REGEX = /^https:\/\/.*\.ngrok.*\.app$/;

const SOCKET_INTERNAL_ORIGIN = process.env.API_INTERNAL_URL;
const SOCKET_INTERNAL_WS = process.env.API_INTERNAL_WS_URL;
const SOCKET_CORS_ORIGINS = [

  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://localhost:3000',
  'https://localhost:3001',
  'https://localhost:3002',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace('http://', 'https://'),
  process.env.FRONTEND_URL_HTTPS,
  process.env.NEXT_PUBLIC_WEB_URL_HTTPS,
  SOCKET_INTERNAL_ORIGIN,
  SOCKET_INTERNAL_WS,
  LAN_ORIGIN_REGEX,
  NGROK_ORIGIN_REGEX,
].filter(Boolean);

interface LocationUpdate {
  jobId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  accuracy: number;
}

interface JobStatusUpdate {
  jobId: string;
  status: string;
  timestamp: string;
  note?: string;
}

@WebSocketGateway({
  cors: {
    origin: SOCKET_CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TrackingGateway');

  constructor(
    @Inject(forwardRef(() => TrackingService))
    private readonly trackingService: TrackingService
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-tracking')
  async joinTracking(@ConnectedSocket() client: Socket, @MessageBody() data: { companyId: string }) {
    const room = `company-${data.companyId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined tracking room: ${room}`);

    client.emit('joined-tracking', {
      success: true,
      room: room,
      message: 'Successfully joined tracking updates'
    });
  }

  @SubscribeMessage('leave-tracking')
  async leaveTracking(@ConnectedSocket() client: Socket, @MessageBody() data: { companyId: string }) {
    const room = `company-${data.companyId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left tracking room: ${room}`);
  }

  @SubscribeMessage('join-job')
  async joinJobTracking(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: string }) {
    const room = `job-${data.jobId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined job tracking: ${room}`);

    client.emit('joined-job', {
      success: true,
      jobId: data.jobId,
      message: 'Successfully joined job tracking'
    });
  }

  @SubscribeMessage('location-update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() locationData: LocationUpdate
  ) {
    try {
      this.logger.log(`Received location update from client ${client.id} for job ${locationData.jobId}`);

      // Convert to DTO format expected by the service
      const locationDto = {
        jobId: locationData.jobId,
        driverId: locationData.driverId,
        lat: locationData.lat,
        lng: locationData.lng,
        speed: locationData.speed,
        heading: locationData.heading,
        timestamp: locationData.timestamp,
        accuracy: locationData.accuracy,
        source: 'DRIVER_APP' as const,
        isManual: false,
      };

      // Save location update via service
      const result = await this.trackingService.updateLocation(locationDto);

      if (result.success) {
        // Send acknowledgment back to the driver
        client.emit('location-update-ack', {
          success: true,
          jobId: locationData.jobId,
          timestamp: locationData.timestamp,
          message: 'Location updated successfully'
        });

        // Get job details to find companyId for broadcasting
        // Broadcast to company tracking room (this will be handled by the service)
        this.logger.debug(`Location update processed successfully for job ${locationData.jobId}`);
      } else {
        client.emit('location-update-ack', {
          success: false,
          jobId: locationData.jobId,
          timestamp: locationData.timestamp,
          error: 'Failed to update location'
        });
        this.logger.error(`Failed to process location update for job ${locationData.jobId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing location update from client ${client.id}:`, error);
      client.emit('location-update-ack', {
        success: false,
        jobId: locationData.jobId,
        error: 'Internal server error while processing location update'
      });
    }
  }

  @SubscribeMessage('live-driver-location')
  async handleLiveDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() locationData: {
      trackerId: string;
      name: string;
      lat: number;
      lng: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      timestamp: string;
      companyId?: string;
    }
  ) {
    try {
      this.logger.log(`Received live driver location from client ${client.id} for tracker ${locationData.trackerId}`);

      // Convert to DTO format expected by the service
      const liveLocationDto = {
        trackerId: locationData.trackerId,
        name: locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        timestamp: locationData.timestamp,
        companyId: locationData.companyId
      };

      // Save live driver location via service
      const result = await this.trackingService.updateLiveDriverLocation(liveLocationDto);

      if (result.success) {
        // Send acknowledgment back to the driver
        client.emit('location-ack', {
          success: true,
          trackerId: locationData.trackerId,
          timestamp: locationData.timestamp,
          message: 'Live location updated successfully'
        });

        this.logger.debug(`Live driver location processed successfully for tracker ${locationData.trackerId}`);
      } else {
        client.emit('location-ack', {
          success: false,
          trackerId: locationData.trackerId,
          timestamp: locationData.timestamp,
          error: 'Failed to update live location'
        });
        this.logger.error(`Failed to process live driver location for tracker ${locationData.trackerId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing live driver location from client ${client.id}:`, error);
      client.emit('location-ack', {
        success: false,
        trackerId: locationData.trackerId,
        error: 'Internal server error while processing live location'
      });
    }
  }

  @SubscribeMessage('identify-tracker')
  async handleIdentifyTracker(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { trackerId: string; name: string; companyId?: string }
  ) {
    this.logger.log(`Tracker identified: ${data.trackerId} (${data.name})`);

    // Store tracker info on client socket for cleanup purposes
    (client as any).trackerId = data.trackerId;
    (client as any).trackerName = data.name;
    (client as any).companyId = data.companyId;

    client.emit('identify-ack', {
      success: true,
      trackerId: data.trackerId,
      message: 'Tracker identified successfully'
    });
  }

  // Emit location update to all clients tracking this company
  emitLocationUpdate(companyId: string, locationUpdate: LocationUpdate) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('location-update', {
      type: 'LOCATION_UPDATE',
      data: locationUpdate,
      timestamp: new Date().toISOString()
    });

    // Also emit to specific job room
    const jobRoom = `job-${locationUpdate.jobId}`;
    this.server.to(jobRoom).emit('location-update', {
      type: 'LOCATION_UPDATE',
      data: locationUpdate,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`Location update emitted for job ${locationUpdate.jobId}`);
  }

  // Emit job status update
  emitJobStatusUpdate(companyId: string, statusUpdate: JobStatusUpdate) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('job-status-update', {
      type: 'JOB_STATUS_UPDATE',
      data: statusUpdate,
      timestamp: new Date().toISOString()
    });

    // Also emit to specific job room
    const jobRoom = `job-${statusUpdate.jobId}`;
    this.server.to(jobRoom).emit('job-status-update', {
      type: 'JOB_STATUS_UPDATE',
      data: statusUpdate,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`Job status update emitted for job ${statusUpdate.jobId}`);
  }

  // Emit geofence event
  emitGeofenceEvent(companyId: string, geofenceEvent: any) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('geofence-event', {
      type: 'GEOFENCE_EVENT',
      data: geofenceEvent,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`Geofence event emitted for job ${geofenceEvent.jobId}`);
  }

  // Emit ETA update
  emitETAUpdate(companyId: string, etaUpdate: any) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('eta-update', {
      type: 'ETA_UPDATE',
      data: etaUpdate,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`ETA update emitted for job ${etaUpdate.jobId}`);
  }

  // Broadcast system notification
  broadcastNotification(companyId: string, notification: any) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('notification', {
      type: 'NOTIFICATION',
      data: notification,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`Notification broadcasted to company ${companyId}`);
  }

  // Get connected clients count for a company
  async getConnectedClientsCount(companyId: string): Promise<number> {
    const room = `company-${companyId}`;
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length;
  }

  // Get all active rooms
  async getActiveRooms(): Promise<string[]> {
    const rooms = this.server.sockets.adapter.rooms;
    return Array.from(rooms.keys()).filter(room => room.startsWith('company-') || room.startsWith('job-'));
  }

  // Emit live driver location update to all clients tracking this company
  emitLiveDriverUpdate(companyId: string, driverUpdate: {
    trackerId: string;
    name: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    timestamp: string;
  }) {
    const room = `company-${companyId}`;
    this.server.to(room).emit('live-driver-update', {
      type: 'LIVE_DRIVER_UPDATE',
      data: driverUpdate,
      timestamp: new Date().toISOString()
    });

    this.logger.debug(`Live driver update emitted for tracker ${driverUpdate.trackerId}`);
  }
}