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
import { Logger, UseGuards } from '@nestjs/common';
import { TrackingV2Service } from './tracking-v2.service';
import { LocationUpdateV2Dto } from './dto/location-update-v2.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

const SOCKET_CORS_ORIGINS = [
  'https://logisticsdash.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
  /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/,
  /^https:\/\/.*\.ngrok.*\.app$/,
  /^https:\/\/logisticsdash-.*\.vercel\.app$/,
].filter(Boolean);

@WebSocketGateway({
  namespace: '/tracking-v2',
  cors: {
    origin: SOCKET_CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['content-type', 'authorization'],
  },
  transports: ['polling', 'websocket'],
})
export class TrackingV2Gateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('TrackingV2Gateway');
  private driverSockets = new Map<string, string>(); // driverId -> socketId

  constructor(
    private trackingService: TrackingV2Service,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('TrackingV2 Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract token from auth header or query
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = this.jwtService.verify(token);

        if (payload.type === 'driver') {
          // Driver connection
          const driverId = payload.driverId;
          this.driverSockets.set(driverId, client.id);
          client.data.driverId = driverId;
          client.data.companyId = payload.companyId;
          client.data.type = 'driver';

          // Join driver's personal room
          client.join(`driver:${driverId}`);
          client.join(`company:${payload.companyId}`);

          // Update driver online status
          await this.prisma.driver.update({
            where: { id: driverId },
            data: { isOnline: true },
          });

          this.logger.log(`Driver ${driverId} connected and joined rooms`);
          client.emit('connected', { message: 'Driver connected successfully' });
        } else {
          // Admin/User connection
          client.data.userId = payload.sub;
          client.data.companyId = payload.companyId;
          client.data.type = 'user';

          // Join company room for monitoring
          client.join(`company:${payload.companyId}`);

          this.logger.log(`User ${payload.sub} connected to company room`);
          client.emit('connected', { message: 'Connected to tracking system' });
        }
      } catch (error) {
        this.logger.error('Invalid token:', error.message);
        client.emit('error', { message: 'Authentication failed' });
        client.disconnect();
      }
    } else {
      // Allow anonymous connections for public tracking
      client.data.type = 'anonymous';
      client.emit('connected', { message: 'Connected as anonymous viewer' });
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.data.type === 'driver' && client.data.driverId) {
      const driverId = client.data.driverId;
      this.driverSockets.delete(driverId);

      // Update driver offline status
      await this.prisma.driver.update({
        where: { id: driverId },
        data: { isOnline: false },
      });

      // Notify company room that driver went offline
      this.server.to(`company:${client.data.companyId}`).emit('driver-offline', {
        driverId,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('driver-location-update')
  async handleDriverLocationUpdate(
    @MessageBody() data: LocationUpdateV2Dto,
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.type !== 'driver') {
      client.emit('error', { message: 'Only drivers can send location updates' });
      return;
    }

    const driverId = client.data.driverId;
    const companyId = client.data.companyId;

    try {
      // Process and store location update
      const locationUpdate = await this.trackingService.processLocationUpdate({
        ...data,
        driverId,
        companyId,
      });

      // Emit acknowledgment to driver
      client.emit('location-update-ack', {
        success: true,
        timestamp: new Date(),
        processed: locationUpdate,
      });

      // Broadcast to company room (admin dashboard)
      this.server.to(`company:${companyId}`).emit('driver-location', {
        driverId,
        jobId: data.jobId,
        location: {
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
        },
        timestamp: data.timestamp,
        driver: locationUpdate.driver,
        job: locationUpdate.job,
      });

      // If job has a client, also broadcast to client room
      if (locationUpdate.job?.clientId) {
        this.server.to(`client:${locationUpdate.job.clientId}`).emit('job-tracking-update', {
          jobId: data.jobId,
          driverId,
          location: {
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            heading: data.heading,
          },
          eta: locationUpdate.eta,
          timestamp: data.timestamp,
        });
      }

      // If public tracking is enabled, broadcast to public room
      if (data.jobId && locationUpdate.job?.shareTrackingLink) {
        this.server.to(`public-tracking:${data.jobId}`).emit('public-location-update', {
          jobId: data.jobId,
          location: {
            lat: data.lat,
            lng: data.lng,
          },
          speed: data.speed,
          eta: locationUpdate.eta,
          timestamp: data.timestamp,
        });
      }

    } catch (error) {
      this.logger.error('Error processing location update:', error);
      client.emit('location-update-error', {
        message: 'Failed to process location update',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('start-job-tracking')
  async handleStartJobTracking(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.type !== 'driver') {
      client.emit('error', { message: 'Only drivers can start job tracking' });
      return;
    }

    const driverId = client.data.driverId;

    try {
      const result = await this.trackingService.startJobTracking(driverId, data.jobId);

      // Join job-specific room
      client.join(`job:${data.jobId}`);

      client.emit('job-tracking-started', result);

      // Notify admin dashboard
      this.server.to(`company:${client.data.companyId}`).emit('job-tracking-started', {
        jobId: data.jobId,
        driverId,
        timestamp: new Date(),
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('stop-job-tracking')
  async handleStopJobTracking(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.type !== 'driver') {
      client.emit('error', { message: 'Only drivers can stop job tracking' });
      return;
    }

    const driverId = client.data.driverId;

    try {
      const result = await this.trackingService.stopJobTracking(driverId, data.jobId);

      // Leave job-specific room
      client.leave(`job:${data.jobId}`);

      client.emit('job-tracking-stopped', result);

      // Notify admin dashboard
      this.server.to(`company:${client.data.companyId}`).emit('job-tracking-stopped', {
        jobId: data.jobId,
        driverId,
        timestamp: new Date(),
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join-company-tracking')
  handleJoinCompanyTracking(
    @MessageBody() data: { companyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Verify user has access to this company
    if (client.data.companyId === data.companyId || client.data.type === 'admin') {
      client.join(`company:${data.companyId}`);
      client.emit('joined-company-tracking', { companyId: data.companyId });
      this.logger.log(`Client ${client.id} joined company tracking: ${data.companyId}`);
    } else {
      client.emit('error', { message: 'Access denied to company tracking' });
    }
  }

  @SubscribeMessage('join-client-tracking')
  handleJoinClientTracking(
    @MessageBody() data: { clientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Verify user has access to this client
    if (client.data.type === 'user' || client.data.type === 'client') {
      client.join(`client:${data.clientId}`);
      client.emit('joined-client-tracking', { clientId: data.clientId });
      this.logger.log(`Client ${client.id} joined client tracking: ${data.clientId}`);
    }
  }

  @SubscribeMessage('join-public-tracking')
  handleJoinPublicTracking(
    @MessageBody() data: { jobId: string, trackingCode?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Verify public tracking is enabled for this job
    // In production, verify trackingCode matches job.shareTrackingLink
    client.join(`public-tracking:${data.jobId}`);
    client.emit('joined-public-tracking', { jobId: data.jobId });
    this.logger.log(`Client ${client.id} joined public tracking: ${data.jobId}`);
  }

  @SubscribeMessage('get-active-drivers')
  async handleGetActiveDrivers(
    @MessageBody() data: { companyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.companyId !== data.companyId && client.data.type !== 'admin') {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    try {
      const activeDrivers = await this.trackingService.getActiveDrivers(data.companyId);
      client.emit('active-drivers', activeDrivers);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Utility method to broadcast to specific rooms
  broadcastToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, data);
  }

  broadcastToJob(jobId: string, event: string, data: any) {
    this.server.to(`job:${jobId}`).emit(event, data);
  }

  broadcastToDriver(driverId: string, event: string, data: any) {
    const socketId = this.driverSockets.get(driverId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  broadcastToClient(clientId: string, event: string, data: any) {
    this.server.to(`client:${clientId}`).emit(event, data);
  }

  /**
   * Broadcast job amendment to all relevant parties
   */
  broadcastJobAmendment(amendment: {
    jobId: string;
    companyId: string;
    driverId?: string;
    clientId?: string;
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
    amendedBy: string;
    amendmentReason: string;
  }) {
    const { jobId, companyId, driverId, clientId, changes, amendedBy, amendmentReason } = amendment;

    // Broadcast to company dashboard (admin/dispatcher)
    this.broadcastToCompany(companyId, 'job:amended', {
      jobId,
      changes,
      amendedBy,
      amendmentReason,
      timestamp: new Date(),
    });

    // Broadcast to specific job room
    this.broadcastToJob(jobId, 'job:amended', {
      changes,
      amendedBy,
      amendmentReason,
      timestamp: new Date(),
    });

    // Broadcast to driver if assigned
    if (driverId) {
      const driverRelevantFields = ['Pickup Time', 'Delivery Time', 'Priority', 'Special Notes', 'Container', 'Vehicle'];
      const driverChanges = changes.filter((c) => driverRelevantFields.includes(c.field));

      if (driverChanges.length > 0) {
        this.broadcastToDriver(driverId, 'job:amended:driver', {
          jobId,
          changes: driverChanges,
          summary: `Job updated: ${driverChanges.map((c) => c.field).join(', ')} changed`,
          timestamp: new Date(),
        });
      }
    }

    // Broadcast to client if exists
    if (clientId) {
      const clientRelevantFields = ['Delivery Time', 'ETA', 'Priority'];
      const clientChanges = changes.filter((c) => clientRelevantFields.includes(c.field));

      if (clientChanges.length > 0) {
        this.server.to(`client:${clientId}`).emit('job:amended:client', {
          jobId,
          changes: clientChanges,
          summary: `Job updated: ${clientChanges.map((c) => c.field).join(', ')} updated`,
          timestamp: new Date(),
        });
      }
    }

    this.logger.log(`Job amendment broadcasted for job ${jobId}`);
  }

  /**
   * Broadcast notification to a specific user/driver/client
   */
  broadcastNotification(notification: {
    recipientId: string;
    recipientType: 'USER' | 'DRIVER' | 'CLIENT';
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    const { recipientId, recipientType, type, title, message, actionUrl } = notification;

    const event = 'notification:new';
    const data = {
      type,
      title,
      message,
      actionUrl,
      timestamp: new Date(),
    };

    // Send to appropriate room based on recipient type
    if (recipientType === 'DRIVER') {
      this.broadcastToDriver(recipientId, event, data);
    } else if (recipientType === 'CLIENT') {
      this.server.to(`client:${recipientId}`).emit(event, data);
    } else {
      // USER (admin/dispatcher)
      this.server.to(`user:${recipientId}`).emit(event, data);
    }

    this.logger.log(`Notification broadcasted to ${recipientType} ${recipientId}`);
  }
}