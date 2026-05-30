import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private notificationsService: NotificationsService,
  ) {}

  async toggleLike(userId: string, postId: string) {
    const client = this.supabaseService.getClient();

    // Check if the target post exists first
    const { data: post, error: postError } = await client
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Try to insert the like first
    const { error: insertError } = await client
      .from('likes')
      .insert({ user_id: userId, post_id: postId });

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique violation means it already exists, so we unlike it
        const { error: deleteError } = await client
          .from('likes')
          .delete()
          .match({ user_id: userId, post_id: postId });

        if (deleteError) {
          this.logger.error(`Error removing like: ${deleteError.message}`);
          throw new BadRequestException('Failed to remove like');
        }
        return { liked: false };
      } else {
        this.logger.error(`Error adding like: ${insertError.message}`);
        throw new BadRequestException('Failed to toggle like');
      }
    }

    // If insert succeeded, we notify and return true
    try {
      await this.notificationsService.createNotification(
        post.user_id,
        userId,
        'like',
        postId,
      );
    } catch (notifyErr) {
      this.logger.warn(
        `Failed to create notification for like: ${notifyErr.message}`,
      );
    }

    return { liked: true };
  }

  async addComment(userId: string, postId: string, content: string) {
    const client = this.supabaseService.getClient();

    // Check if post exists
    const { data: post, error: postError } = await client
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const { data, error } = await client
      .from('comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content: content,
      })
      .select('*, user:users(*)')
      .single();

    if (error) {
      this.logger.error(`Error adding comment: ${error.message}`);
      throw new BadRequestException(`Failed to add comment: ${error.message}`);
    }

    // Log notification (fail silently so it doesn't block main operation)
    try {
      await this.notificationsService.createNotification(
        post.user_id,
        userId,
        'comment',
        postId,
      );
    } catch (notifyErr) {
      this.logger.warn(
        `Failed to create notification for comment: ${notifyErr.message}`,
      );
    }

    return data;
  }

  async getComments(postId: string) {
    const client = this.supabaseService.getClient();

    // Check if post exists
    const { data: post, error: postError } = await client
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const { data, error } = await client
      .from('comments')
      .select('*, user:users(*)')
      .match({ post_id: postId })
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      this.logger.error(`Error fetching comments: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch comments: ${error.message}`,
      );
    }
    return data;
  }
}
