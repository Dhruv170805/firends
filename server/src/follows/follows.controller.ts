import {
  Controller,
  Post,
  Get,
  Param,
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
  async getFollowers(@Request() req: AuthenticatedRequest) {
    return this.followsService.getFollowers(req.user.userId);
  }

  @Get('following')
  async getFollowing(@Request() req: AuthenticatedRequest) {
    return this.followsService.getFollowing(req.user.userId);
  }
}
