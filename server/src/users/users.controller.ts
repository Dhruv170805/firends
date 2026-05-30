import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { UpdateUserDto } from './dto/update-user.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseGuard)
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('me/stats')
  @UseGuards(SupabaseGuard)
  async getStats(@Request() req: AuthenticatedRequest) {
    return this.usersService.getStats(req.user.userId);
  }

  @Patch('me')
  @UseGuards(SupabaseGuard)
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }
}
