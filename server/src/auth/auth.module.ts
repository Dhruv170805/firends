import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseGuard } from './supabase.guard';
import { OptionalSupabaseGuard } from './optional-supabase.guard';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [SupabaseGuard, OptionalSupabaseGuard],
  exports: [SupabaseGuard, OptionalSupabaseGuard],
})
export class AuthModule {}
