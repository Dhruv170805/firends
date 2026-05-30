import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHeartbeat() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
