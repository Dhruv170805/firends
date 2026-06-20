import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private supabaseService: SupabaseService,
    @InjectQueue('moderation') private moderationQueue: Queue,
  ) {}

  async findAll(limit: number = 10, cursor?: string, userId?: string) {
    const client = this.supabaseService.getClient();
    let query = client
      .from('posts')
      .select(
        '*, user:users(*), media:post_media(*), likes(count), comments(count)',
      )
      .is('sector_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching posts: ${error.message}`);
      throw new BadRequestException(`Failed to fetch posts: ${error.message}`);
    }

    // Process counts and check if liked by user in a single optimized query
    let likedPostIds = new Set<string>();
    if (userId && data && data.length > 0) {
      const postIds = data.map((post) => post.id);
      const { data: likesData, error: likesError } = await client
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (!likesError && likesData) {
        likedPostIds = new Set(likesData.map((l) => l.post_id));
      }
    }

    return data.map((post) => ({
      ...post,
      likes_count: post.likes?.[0]?.count || 0,
      comments_count: post.comments?.[0]?.count || 0,
      is_liked: likedPostIds.has(post.id),
    }));
  }

  async search(query: string, userId?: string) {
    const client = this.supabaseService.getClient();

    // Sanitize query to prevent PostgREST syntax injection
    const sanitizedQuery = query.replace(/[%,"]/g, '').trim();

    const { data, error } = await client
      .from('posts')
      .select(
        '*, user:users(*), media:post_media(*), likes(count), comments(count)',
      )
      .is('sector_id', null)
      .or(
        `caption.ilike.%${sanitizedQuery}%,location.ilike.%${sanitizedQuery}%`,
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      this.logger.error(`Error searching posts: ${error.message}`);
      throw new BadRequestException(`Failed to search posts: ${error.message}`);
    }

    // Process counts and check if liked by user in a single optimized query
    let likedPostIds = new Set<string>();
    if (userId && data && data.length > 0) {
      const postIds = data.map((post) => post.id);
      const { data: likesData, error: likesError } = await client
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (!likesError && likesData) {
        likedPostIds = new Set(likesData.map((l) => l.post_id));
      }
    }

    return data.map((post) => ({
      ...post,
      likes_count: post.likes?.[0]?.count || 0,
      comments_count: post.comments?.[0]?.count || 0,
      is_liked: likedPostIds.has(post.id),
    }));
  }

  async create(userId: string, createPostDto: CreatePostDto) {
    const client = this.supabaseService.getClient();

    // Create the post
    const { data: post, error: postError } = await client
      .from('posts')
      .insert({
        user_id: userId,
        caption: createPostDto.caption,
        location: createPostDto.location,
        visibility: createPostDto.visibility || 'public',
        sector_id: createPostDto.sector_id || null,
      })
      .select()
      .single();

    if (postError) {
      this.logger.error(`Error creating post: ${postError.message}`);
      throw new BadRequestException(
        `Failed to create post: ${postError.message}`,
      );
    }

    // Insert media if provided
    if (createPostDto.media && createPostDto.media.length > 0) {
      const mediaData = createPostDto.media.map((m) => ({
        post_id: post.id,
        media_url: m.media_url,
        media_type: m.media_type || 'image',
        thumbnail_url: m.thumbnail_url,
        duration: m.duration,
      }));

      const { error: mediaError } = await client
        .from('post_media')
        .insert(mediaData);

      if (mediaError) {
        this.logger.error(`Error creating post media: ${mediaError.message}`);
        throw new InternalServerErrorException(
          `Failed to upload post media: ${mediaError.message}`,
        );
      }
    }

    // Fire-and-forget: Push the new post to the AI Moderation Queue
    // This allows the user to instantly see their post upload successfully
    // while the backend analyzes it asynchronously.
    await this.moderationQueue
      .add('moderate-post', {
        postId: post.id,
        caption: createPostDto.caption,
        media: createPostDto.media || [],
      })
      .catch((err) => {
        this.logger.error(
          `Failed to push job to moderation queue: ${err.message}`,
        );
      });

    return post;
  }
}
