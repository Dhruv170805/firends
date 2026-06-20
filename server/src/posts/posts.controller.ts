import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { PostsService } from './posts.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { OptionalSupabaseGuard } from '../auth/optional-supabase.guard';
import { CreatePostDto } from './dto/create-post.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

interface OptionalAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalSupabaseGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(15000) // Cache for 15 seconds
  async findAll(
    @Request() req: OptionalAuthenticatedRequest,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    const userId = req.user?.userId;
    return this.postsService.findAll(
      limit ? Number(limit) : 10,
      cursor,
      userId,
    );
  }

  @Get('search')
  @UseGuards(OptionalSupabaseGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000) // Cache search results for 30 seconds
  async search(
    @Request() req: OptionalAuthenticatedRequest,
    @Query('q') query: string,
  ) {
    const userId = req.user?.userId;
    return this.postsService.search(query || '', userId);
  }

  @Post()
  @UseGuards(SupabaseGuard)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(req.user.userId, createPostDto);
  }
}
