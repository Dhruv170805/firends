import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    PostsModule,
    InteractionsModule,
    UsersModule,
    FollowsModule,
    StoriesModule,
    NotificationsModule,
    SectorsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, HealthService],
})
export class AppModule {}
