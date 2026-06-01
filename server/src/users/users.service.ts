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

    const { data, error } = await client
      .rpc('get_user_stats', { p_user_id: userId });

    if (error || !data) {
      this.logger.error(`Error fetching user stats: ${error?.message}`);
      throw new BadRequestException(
        `Failed to retrieve stats: ${error?.message}`,
      );
    }

    return data;
  }
}
