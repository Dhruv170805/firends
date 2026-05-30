import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CreateStoryDto } from './dto/create-story.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('stories')
@UseGuards(SupabaseGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  async createStory(
    @Request() req: AuthenticatedRequest,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    return this.storiesService.createStory(req.user.userId, createStoryDto);
  }

  @Get()
  async getActiveStories(@Request() req: AuthenticatedRequest) {
    return this.storiesService.getActiveStories(req.user.userId);
  }
}
