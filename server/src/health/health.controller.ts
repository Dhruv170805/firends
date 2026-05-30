import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HealthService } from './health.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('heartbeat')
  getHeartbeat() {
    return this.healthService.getHeartbeat();
  }

  @Post('report')
  @UseGuards(SupabaseGuard)
  reportEvent(@Request() req: any, @Body() eventData: any) {
    // In a real app, this would log to an analytics service or DB
    console.log(`[Heartbeat] Event from user ${req.user.userId}:`, eventData);
    return { received: true };
  }
}
