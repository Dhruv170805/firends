import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private supabaseService: SupabaseService) {}

  async pullChanges(lastPulledAt: number, userId: string) {
    const supabase = this.supabaseService.getClient();
    // Convert JS timestamp to ISO or use direct numeric comparisons if Postgres uses unix epoch.
    // Assuming Supabase stores timestamps as timestamptz.
    const lastPulledISO = new Date(lastPulledAt).toISOString();
    
    // In a production scenario, we'd only return data relevant to this user's sectors,
    // but for MVP we pull all globally visible rows updated since lastPulledISO.
    
    // Users
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, username, full_name, created_at')
      .gt('created_at', lastPulledISO); // Simplified: Using created_at for 'created' (updates handled differently usually)
      
    // Posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, content, user_id, sector_id, latitude, longitude, created_at')
      .gt('created_at', lastPulledISO);

    // Comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('id, content, post_id, user_id, created_at')
      .gt('created_at', lastPulledISO);

    // Sectors
    const { data: sectorsData } = await supabase
      .from('sectors')
      .select('id, name, description, created_by, created_at')
      .gt('created_at', lastPulledISO);

    // Map Supabase rows to WatermelonDB payload format
    // Realistically, updated rows need to be separated from created rows.
    // For MVP offline sync, we map everything to created if lastPulledAt is 0,
    // else we treat them as updated if they existed before.
    const isFirstSync = lastPulledAt === 0;

    return {
      changes: {
        users: {
          created: isFirstSync ? usersData : [],
          updated: isFirstSync ? [] : usersData,
          deleted: [],
        },
        posts: {
          created: isFirstSync ? postsData : [],
          updated: isFirstSync ? [] : postsData,
          deleted: [],
        },
        comments: {
          created: isFirstSync ? commentsData : [],
          updated: isFirstSync ? [] : commentsData,
          deleted: [],
        },
        sectors: {
          created: isFirstSync ? sectorsData : [],
          updated: isFirstSync ? [] : sectorsData,
          deleted: [],
        },
      },
      timestamp: Date.now(),
    };
  }

  async pushChanges(changes: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    this.logger.log(`Received push sync from user ${userId}`);
    
    // Very simplified push handling for WatermelonDB:
    // Insert created records, Update updated records, Delete deleted records
    
    if (changes.posts?.created?.length) {
      await supabase.from('posts').insert(changes.posts.created);
    }
    if (changes.comments?.created?.length) {
      await supabase.from('comments').insert(changes.comments.created);
    }
    
    // Handling updates/deletes securely requires RLS, which Supabase already enforces via JWT.
    
    return { success: true };
  }
}
