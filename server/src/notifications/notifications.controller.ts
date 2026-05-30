import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SupabaseGuard } from '../auth/supabase.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('notifications')
@UseGuards(SupabaseGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.getNotifications(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(
      req.user.userId,
      notificationId,
    );
  }
}
