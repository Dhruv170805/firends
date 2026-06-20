import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const client = this.supabaseService.getClient();

    // Verify the target user exists
    const { data: user, error: userError } = await client
      .from('users')
      .select('id')
      .eq('id', followingId)
      .maybeSingle();

    if (userError || !user) {
      throw new NotFoundException(
        `User to follow with ID ${followingId} not found`,
      );
    }

    // Check if relationship exists
    const { data: existingFollow, error: checkError } = await client
      .from('follows')
      .select('id')
      .match({ follower_id: followerId, following_id: followingId })
      .maybeSingle();

    if (checkError) {
      this.logger.error(`Error checking follow status: ${checkError.message}`);
      throw new BadRequestException(
        `Failed to toggle follow: ${checkError.message}`,
      );
    }

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await client
        .from('follows')
        .delete()
        .match({ follower_id: followerId, following_id: followingId });

      if (deleteError) {
        this.logger.error(`Error deleting follow: ${deleteError.message}`);
        throw new BadRequestException(
          `Failed to unfollow: ${deleteError.message}`,
        );
      }
      return { followed: false };
    } else {
      // Follow
      const { error: insertError } = await client
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });

      if (insertError) {
        this.logger.error(`Error creating follow: ${insertError.message}`);
        throw new BadRequestException(
          `Failed to follow: ${insertError.message}`,
        );
      }
      return { followed: true };
    }
  }

  async getFollowers(userId: string, limit: number = 50, cursor?: string) {
    const client = this.supabaseService.getClient();
    let query = client
      .from('follows')
      .select('created_at, follower:users(*)')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching followers: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch followers: ${error.message}`,
      );
    }

    return (
      data?.map((item: any) => ({
        ...item.follower,
        follow_created_at: item.created_at,
      })) || []
    );
  }

  async getFollowing(userId: string, limit: number = 50, cursor?: string) {
    const client = this.supabaseService.getClient();
    let query = client
      .from('follows')
      .select('created_at, following:users(*)')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching following list: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch following list: ${error.message}`,
      );
    }

    return (
      data?.map((item: any) => ({
        ...item.following,
        follow_created_at: item.created_at,
      })) || []
    );
  }
}
