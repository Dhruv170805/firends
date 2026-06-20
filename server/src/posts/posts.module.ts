import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'moderation',
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
