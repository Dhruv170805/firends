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

    // Check if like exists (use maybeSingle to prevent PGRST116 no-rows error)
    const { data: existingLike, error: likeCheckError } = await client
      .from('likes')
      .select('id')
      .match({ user_id: userId, post_id: postId })
      .maybeSingle();

    if (likeCheckError) {
      this.logger.error(`Error checking like state: ${likeCheckError.message}`);
      throw new BadRequestException(
        `Failed to toggle like: ${likeCheckError.message}`,
      );
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await client
        .from('likes')
        .delete()
        .match({ user_id: userId, post_id: postId });

      if (deleteError) {
        this.logger.error(`Error removing like: ${deleteError.message}`);
        throw new BadRequestException(
          `Failed to remove like: ${deleteError.message}`,
        );
      }
      return { liked: false };
    } else {
      // Like
      const { error: insertError } = await client
        .from('likes')
        .insert({ user_id: userId, post_id: postId });

      if (insertError) {
        this.logger.error(`Error adding like: ${insertError.message}`);
        throw new BadRequestException(
          `Failed to add like: ${insertError.message}`,
        );
      }

      // Log notification (fail silently so it doesn't block main operation)
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
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching comments: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch comments: ${error.message}`,
      );
    }
    return data;
  }
}
