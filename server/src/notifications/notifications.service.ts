import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async createNotification(
    recipientId: string,
    senderId: string,
    type: 'like' | 'comment' | 'follow',
    postId?: string,
  ) {
    // Avoid notifying users of their own activity
    if (recipientId === senderId) return null;

    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        post_id: postId || null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error logging notification: ${error.message}`);
      // Fail silently in production or return null so it doesn't block likes/comments
      return null;
    }

    return data;
  }

  async getNotifications(userId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('notifications')
      .select('*, sender:users!notifications_sender_id_fkey(*), post:posts(*)')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`Error fetching user notifications: ${error.message}`);
      throw new BadRequestException(
        `Failed to retrieve notifications: ${error.message}`,
      );
    }

    return data || [];
  }

  async markAsRead(userId: string, notificationId: string) {
    const client = this.supabaseService.getClient();

    // Verify existence/ownership
    const { data: notification, error: checkError } = await client
      .from('notifications')
      .select('id')
      .match({ id: notificationId, recipient_id: userId })
      .maybeSingle();

    if (checkError || !notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    const { data, error } = await client
      .from('notifications')
      .update({ read: true })
      .match({ id: notificationId, recipient_id: userId })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Error updating notification read state: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to mark notification as read: ${error.message}`,
      );
    }

    return data;
  }
}
