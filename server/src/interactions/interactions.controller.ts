import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('like/:postId')
  @UseGuards(SupabaseGuard)
  async toggleLike(
    @Request() req: AuthenticatedRequest,
    @Param('postId') postId: string,
  ) {
    return this.interactionsService.toggleLike(req.user.userId, postId);
  }

  @Post('comment/:postId')
  @UseGuards(SupabaseGuard)
  async addComment(
    @Request() req: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.interactionsService.addComment(
      req.user.userId,
      postId,
      createCommentDto.content,
    );
  }

  @Get('comments/:postId')
  async getComments(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.interactionsService.getComments(postId, parsedLimit, cursor);
  }
}
