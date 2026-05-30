import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance: SupabaseClient;

  constructor(private configService: ConfigService) {}

  getClient() {
    this.logger.log('Initializing Supabase client...');
    if (this.clientInstance) {
      return this.clientInstance;
    }

    this.clientInstance = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
    );
    return this.clientInstance;
  }
}
