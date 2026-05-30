import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CreateSectorDto } from './dto/create-sector.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JoinSectorDto } from './dto/join-sector.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('sectors')
@UseGuards(SupabaseGuard)
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createSectorDto: CreateSectorDto,
  ) {
    return this.sectorsService.createSector(req.user.userId, createSectorDto);
  }

  @Post('join')
  async join(
    @Request() req: AuthenticatedRequest,
    @Body() joinSectorDto: JoinSectorDto,
  ) {
    return this.sectorsService.joinSector(
      req.user.userId,
      joinSectorDto.inviteCode,
    );
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.sectorsService.getSectors(req.user.userId);
  }

  @Post(':id/members')
  async addMember(
    @Request() req: AuthenticatedRequest,
    @Param('id') sectorId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.sectorsService.addMember(
      req.user.userId,
      sectorId,
      addMemberDto.username,
    );
  }

  @Get(':id/members')
  async getMembers(
    @Request() req: AuthenticatedRequest,
    @Param('id') sectorId: string,
  ) {
    return this.sectorsService.getMembers(req.user.userId, sectorId);
  }

  @Get(':id/posts')
  async getPosts(
    @Request() req: AuthenticatedRequest,
    @Param('id') sectorId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.sectorsService.getPosts(
      req.user.userId,
      sectorId,
      limit ? Number(limit) : 10,
      cursor,
    );
  }
}
