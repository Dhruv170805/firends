import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class SectorsService {
  private readonly logger = new Logger(SectorsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async createSector(userId: string, createSectorDto: CreateSectorDto) {
    const client = this.supabaseService.getClient();

    // 1. Create the Sector & Leader via atomic RPC
    const { data: sector, error: sectorError } = await client.rpc(
      'create_sector_with_leader',
      {
        p_name: createSectorDto.name,
        p_description: createSectorDto.description || null,
        p_created_by: userId,
      },
    );

    if (sectorError || !sector) {
      this.logger.error(`Error creating sector: ${sectorError?.message}`);
      throw new BadRequestException(
        `Failed to create sector: ${sectorError?.message}`,
      );
    }

    return sector;
  }

  async getSectors(userId: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('sector_members')
      .select('role, sector:sectors(*)')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error fetching sectors: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch sectors: ${error.message}`,
      );
    }

    return data
      .filter((m) => m.sector !== null)
      .map((m) => ({
        ...m.sector,
        user_role: m.role,
      }));
  }

  async addMember(userId: string, sectorId: string, username: string) {
    const client = this.supabaseService.getClient();

    // 1. Verify the current user is a leader of the sector
    const { data: membership, error: membershipError } = await client
      .from('sector_members')
      .select('role')
      .eq('sector_id', sectorId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership || membership.role !== 'leader') {
      throw new ForbiddenException(
        'Only the Sector Leader can add new members.',
      );
    }

    // 2. Find target user by username
    const { data: targetUser, error: userError } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !targetUser) {
      throw new NotFoundException(
        `User with username "${username}" not found.`,
      );
    }

    // 3. Insert user as member
    const { data: newMember, error: insertError } = await client
      .from('sector_members')
      .insert({
        sector_id: sectorId,
        user_id: targetUser.id,
        role: 'member',
      })
      .select('*, user:users(*)')
      .single();

    if (insertError) {
      this.logger.error(`Error adding sector member: ${insertError.message}`);
      if (insertError.code === '23505') {
        throw new BadRequestException(
          'User is already a member of this Sector.',
        );
      }
      throw new BadRequestException('Failed to add member to the sector.');
    }

    return newMember;
  }

  async getMembers(userId: string, sectorId: string) {
    const client = this.supabaseService.getClient();

    // Verify current user is a member of the sector
    const { data: membership, error: membershipError } = await client
      .from('sector_members')
      .select('id')
      .eq('sector_id', sectorId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw new ForbiddenException(
        'You must be a member of this Sector to view its participants.',
      );
    }

    const { data, error } = await client
      .from('sector_members')
      .select('id, role, created_at, user:users(*)')
      .eq('sector_id', sectorId);

    if (error) {
      this.logger.error(`Error fetching sector members: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch sector members: ${error.message}`,
      );
    }

    return data;
  }

  async getPosts(
    userId: string,
    sectorId: string,
    limit: number = 10,
    cursor?: string,
  ) {
    const client = this.supabaseService.getClient();

    // Verify current user is a member of the sector
    const { data: membership, error: membershipError } = await client
      .from('sector_members')
      .select('id')
      .eq('sector_id', sectorId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw new ForbiddenException(
        'You must be a member of this Sector to view its timeline.',
      );
    }

    let query = client
      .from('posts')
      .select(
        '*, user:users(*), media:post_media(*), likes(count), comments(count)',
      )
      .eq('sector_id', sectorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error fetching sector posts: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch sector posts: ${error.message}`,
      );
    }

    // Process counts and check if liked by user
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

  async joinSector(userId: string, inviteCode: string) {
    const client = this.supabaseService.getClient();

    // 1. Verify the sector exists
    const { data: sector, error: sectorError } = await client
      .from('sectors')
      .select('id, name')
      .eq('id', inviteCode)
      .maybeSingle();

    if (sectorError || !sector) {
      throw new NotFoundException(
        'Sector not found. Please verify the access code.',
      );
    }

    // 2. Add the user as a member
    const { error: insertError } = await client
      .from('sector_members')
      .insert({
        sector_id: sector.id,
        user_id: userId,
        role: 'member',
      })
      .select()
      .single();

    if (insertError) {
      this.logger.error(`Error joining sector: ${insertError.message}`);
      if (insertError.code === '23505') {
        throw new BadRequestException(
          'You are already a member of this Sector.',
        );
      }
      throw new BadRequestException('Failed to join sector.');
    }

    return sector;
  }
}
