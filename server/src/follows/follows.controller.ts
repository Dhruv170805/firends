import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { SupabaseGuard } from '../auth/supabase.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('follows')
@UseGuards(SupabaseGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  async toggleFollow(
    @Request() req: AuthenticatedRequest,
    @Param('userId') followingId: string,
  ) {
    return this.followsService.toggleFollow(req.user.userId, followingId);
  }

  @Get('followers')
  async getFollowers(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.followsService.getFollowers(
      req.user.userId,
      parsedLimit,
      cursor,
    );
  }

  @Get('following')
  async getFollowing(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.followsService.getFollowing(
      req.user.userId,
      parsedLimit,
      cursor,
    );
  }
}
