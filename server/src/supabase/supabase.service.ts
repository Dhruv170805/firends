import { Injectable, Logger, Inject, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance: SupabaseClient;

  constructor(
    @Inject(REQUEST) private request: Request,
    private configService: ConfigService
  ) {}

  getClient() {
    this.logger.log('Initializing Supabase client...');
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const authHeader = this.request?.headers?.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : undefined;

    this.clientInstance = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : undefined,
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    return this.clientInstance;
  }
}
