import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
// TODO: Add authentication guard when auth module is implemented
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':recipientId')
  @ApiOperation({ summary: 'Get notifications for a user/driver/client' })
  @ApiResponse({ status: 200, description: 'Returns list of notifications' })
  async getNotifications(
    @Param('recipientId') recipientId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.notificationsService.getNotifications(
      recipientId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Query('recipientId') recipientId: string) {
    return this.notificationsService.markAsRead(id, recipientId);
  }

  @Patch(':recipientId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a recipient' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Param('recipientId') recipientId: string) {
    return this.notificationsService.markAllAsRead(recipientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @Query('recipientId') recipientId: string) {
    return this.notificationsService.deleteNotification(id, recipientId);
  }
}
