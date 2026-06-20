import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(SupabaseGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  async pullChanges(
    @Query('last_pulled_at') lastPulledAt: string,
    @Query('schema_version') schemaVersion: string,
    @Req() req: any,
  ) {
    const pulledAtNum = parseInt(lastPulledAt, 10) || 0;
    const userId = req.user?.sub;
    return this.syncService.pullChanges(pulledAtNum, userId);
  }

  @Post()
  async pushChanges(
    @Body('changes') changes: any,
    @Body('lastPulledAt') lastPulledAt: number,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    return this.syncService.pushChanges(changes, userId);
  }
}
