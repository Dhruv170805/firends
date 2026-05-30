import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findOne(userId: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding user profile: ${error.message}`);
      throw new BadRequestException(
        `Failed to retrieve profile: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return data;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const client = this.supabaseService.getClient();

    // Check if user profile exists
    const { data: user, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError || !user) {
      throw new NotFoundException(`User profile not found`);
    }

    const { data, error } = await client
      .from('users')
      .update({
        username: updateUserDto.username,
        avatar_url: updateUserDto.avatar_url,
        bio: updateUserDto.bio,
        college_id: updateUserDto.college_id,
        batch_year: updateUserDto.batch_year,
        full_name: updateUserDto.full_name,
        phone: updateUserDto.phone,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating user profile: ${error.message}`);
      throw new BadRequestException(
        `Failed to update profile: ${error.message}`,
      );
    }

    return data;
  }

  async getStats(userId: string) {
    const client = this.supabaseService.getClient();

    // 1. Total Nodes (Posts)
    const { count: totalNodes, error: countError } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      this.logger.error(`Error counting user posts: ${countError.message}`);
      throw new BadRequestException(
        `Failed to retrieve stats: ${countError.message}`,
      );
    }

    // 2. Nights Logged (Posts created between 9 PM and 6 AM)
    const { data: timeData, error: timeError } = await client
      .from('posts')
      .select('created_at')
      .eq('user_id', userId);

    if (timeError) {
      this.logger.error(`Error fetching post timestamps: ${timeError.message}`);
      throw new BadRequestException(
        `Failed to retrieve stats: ${timeError.message}`,
      );
    }

    let nightsLogged = 0;
    if (timeData) {
      for (const post of timeData) {
        const hour = new Date(post.created_at).getHours();
        if (hour >= 21 || hour < 6) {
          nightsLogged++;
        }
      }
    }

    // 3. Timeline Flow (Sum of likes + comments across all user's posts)
    const { data: interactionData, error: interactionError } = await client
      .from('posts')
      .select('id, likes(count), comments(count)')
      .eq('user_id', userId);

    if (interactionError) {
      this.logger.error(
        `Error fetching post interactions: ${interactionError.message}`,
      );
      throw new BadRequestException(
        `Failed to retrieve stats: ${interactionError.message}`,
      );
    }

    let timelineFlow = 0;
    if (interactionData) {
      for (const post of interactionData) {
        const lCount = (post.likes as any)?.[0]?.count || 0;
        const cCount = (post.comments as any)?.[0]?.count || 0;
        timelineFlow += lCount + cCount;
      }
    }

    // 4. Milestones (Posts with spatial coordinates / location)
    const { count: milestones, error: milestonesError } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('latitude', 'is', null);

    if (milestonesError) {
      this.logger.error(
        `Error counting milestones: ${milestonesError.message}`,
      );
      throw new BadRequestException(
        `Failed to retrieve stats: ${milestonesError.message}`,
      );
    }

    return {
      totalNodes: totalNodes || 0,
      nightsLogged: nightsLogged || 0,
      timelineFlow: timelineFlow || 0,
      milestones: milestones || 0,
    };
  }
}
