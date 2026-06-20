import { Module } from '@nestjs/common';
import { ModerationProcessor } from './moderation.processor';

@Module({
  providers: [ModerationProcessor],
})
export class ModerationModule {}
