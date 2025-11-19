import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId: dto.companyId,
        recipientId: dto.recipientId,
        recipientType: dto.recipientType || 'USER',
        type: dto.type,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl,
        jobId: dto.jobId,
        jobUpdateId: dto.jobUpdateId,
        status: NotificationStatus.PENDING,
        channels: dto.channels || { app: true },
        metadata: dto.metadata || {},
      },
    });

    // Send notification via configured channels
    await this.sendNotification(notification);

    return notification;
  }

  /**
   * Send notification to driver
   */
  async sendToDriver(
    driverId: string,
    companyId: string,
    title: string,
    message: string,
    jobId?: string,
    metadata?: any
  ) {
    return this.createNotification({
      companyId,
      recipientId: driverId,
      recipientType: 'DRIVER',
      type: NotificationType.JOB_UPDATE,
      title,
      message,
      jobId,
      actionUrl: jobId ? `/driver/jobs/${jobId}` : undefined,
      channels: { app: true, sms: false }, // SMS can be enabled based on urgency
      metadata,
    });
  }

  /**
   * Send notification to client
   */
  async sendToClient(
    clientId: string,
    companyId: string,
    title: string,
    message: string,
    jobId?: string,
    metadata?: any
  ) {
    return this.createNotification({
      companyId,
      recipientId: clientId,
      recipientType: 'CLIENT',
      type: NotificationType.JOB_UPDATE,
      title,
      message,
      jobId,
      actionUrl: jobId ? `/client/jobs/${jobId}` : undefined,
      channels: { app: true, email: true },
      metadata,
    });
  }

  /**
   * Send notification to admin/dispatcher
   */
  async sendToUser(
    userId: string,
    companyId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.JOB_UPDATE,
    jobId?: string,
    metadata?: any
  ) {
    return this.createNotification({
      companyId,
      recipientId: userId,
      recipientType: 'USER',
      type,
      title,
      message,
      jobId,
      actionUrl: jobId ? `/dashboard/jobs/${jobId}` : undefined,
      channels: { app: true },
      metadata,
    });
  }

  /**
   * Get notifications for a user/driver/client
   */
  async getNotifications(recipientId: string, limit: number = 50, offset: number = 0) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { recipientId } }),
    ]);

    return {
      success: true,
      data: notifications,
      meta: {
        total,
        limit,
        offset,
        unreadCount: notifications.filter((n) => !n.readAt).length,
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, recipientId: string) {
    const notification = await this.prisma.notification.updateMany({
      where: { id, recipientId },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });

    return {
      success: notification.count > 0,
      message: notification.count > 0 ? 'Notification marked as read' : 'Notification not found',
    };
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(recipientId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });

    return {
      success: true,
      data: { updatedCount: result.count },
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, recipientId: string) {
    const notification = await this.prisma.notification.deleteMany({
      where: { id, recipientId },
    });

    return {
      success: notification.count > 0,
      message: notification.count > 0 ? 'Notification deleted' : 'Notification not found',
    };
  }

  /**
   * Send notification via configured channels
   * This is where you'd integrate with email/SMS services
   */
  private async sendNotification(notification: any) {
    const channels = notification.channels as any;

    try {
      // In-app notification is handled by WebSocket (will be integrated separately)
      if (channels?.app) {
        this.logger.log(`In-app notification sent to ${notification.recipientId}`);
      }

      // Email notification (integrate with your email service - SendGrid, AWS SES, etc.)
      if (channels?.email) {
        this.logger.log(`Email notification would be sent to ${notification.recipientId}`);
        // TODO: Integrate email service
        // await this.emailService.send({
        //   to: recipientEmail,
        //   subject: notification.title,
        //   body: notification.message,
        // });
      }

      // SMS notification (integrate with Twilio, AWS SNS, etc.)
      if (channels?.sms) {
        this.logger.log(`SMS notification would be sent to ${notification.recipientId}`);
        // TODO: Integrate SMS service
        // await this.smsService.send({
        //   to: recipientPhone,
        //   message: notification.message,
        // });
      }

      // Update status to DELIVERED
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // Update status to FAILED
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
    }
  }
}
