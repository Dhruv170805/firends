import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('moderation')
export class ModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ModerationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Received job ${job.id} for post moderation.`);
    const { postId, caption } = job.data;

    this.logger.log(`Analyzing content for post ${postId}...`);

    // Simulate an AI Model delay (e.g. sending image/text to Google Cloud Vision or OpenAI)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Heuristics or AI Response Mock
    const isClean = this.simulateAIModeration(caption);

    if (isClean) {
      this.logger.log(
        `[PASS] Post ${postId} successfully passed AI moderation.`,
      );
      // In a real scenario, you might update the post's moderation_status to 'approved' here.
    } else {
      this.logger.warn(
        `[REJECT] Post ${postId} failed AI moderation! Content flagged.`,
      );
      // In a real scenario, you would invoke the Supabase client here to hide/delete the post
      // or flag it for manual human review.
    }

    return { status: isClean ? 'approved' : 'rejected' };
  }

  private simulateAIModeration(caption?: string): boolean {
    if (!caption) return true;

    // Simple mock logic: reject if it contains certain bad words
    const flaggedWords = ['spam', 'scam', 'abuse'];
    const lowerCaption = caption.toLowerCase();

    return !flaggedWords.some((word) => lowerCaption.includes(word));
  }
}
