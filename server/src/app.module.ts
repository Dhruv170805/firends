import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { InteractionsModule } from './interactions/interactions.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { FollowsModule } from './follows/follows.module';
import { StoriesModule } from './stories/stories.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SectorsModule } from './sectors/sectors.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    SupabaseModule,
    AuthModule,
    PostsModule,
    InteractionsModule,
    UsersModule,
    FollowsModule,
    StoriesModule,
    NotificationsModule,
    SectorsModule,
    ModerationModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
