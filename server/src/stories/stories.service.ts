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

    const { data: storiesData, error } = await client
      .rpc('get_active_stories_for_user', { p_user_id: userId });

    if (error) {
      this.logger.error(`Error getting active stories: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch active stories: ${error.message}`,
      );
    }

    // Group stories by user (matching Standard/Standard structures)
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
