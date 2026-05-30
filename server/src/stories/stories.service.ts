import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(private supabaseService: SupabaseService) {}

  async createStory(userId: string, createStoryDto: CreateStoryDto) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('stories')
      .insert({
        user_id: userId,
        media_url: createStoryDto.media_url,
        media_type: createStoryDto.media_type || 'image',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating story: ${error.message}`);
      throw new BadRequestException(`Failed to create story: ${error.message}`);
    }

    return data;
  }

  async getActiveStories(userId: string) {
    const client = this.supabaseService.getClient();

    // 1. Fetch users followed by the current user
    const { data: followingData, error: followingError } = await client
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      this.logger.error(
        `Error getting followed users for stories: ${followingError.message}`,
      );
      throw new BadRequestException(
        `Failed to fetch stories: ${followingError.message}`,
      );
    }

    const targetUserIds = [
      userId,
      ...(followingData?.map((f: any) => f.following_id) || []),
    ];

    // 2. Fetch all active stories for these users (including creator profiles)
    const { data: storiesData, error: storiesError } = await client
      .from('stories')
      .select('*, user:users(*)')
      .in('user_id', targetUserIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (storiesError) {
      this.logger.error(
        `Error getting active stories: ${storiesError.message}`,
      );
      throw new BadRequestException(
        `Failed to fetch active stories: ${storiesError.message}`,
      );
    }

    // 3. Group stories by user (matching Snapchat/Instagram structures)
    const groupedMap = new Map<string, { user: any; stories: any[] }>();

    for (const story of storiesData || []) {
      const creator = story.user;
      if (!creator) continue;

      // Strip user details from story object for cleaner data models
      const storyObj = { ...story };
      delete storyObj.user;

      if (!groupedMap.has(creator.id)) {
        groupedMap.set(creator.id, {
          user: creator,
          stories: [],
        });
      }

      groupedMap.get(creator.id)!.stories.push(storyObj);
    }

    return Array.from(groupedMap.values());
  }
}
