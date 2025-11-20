import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InstagramService } from '../../instagram/instagram.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { InsightsJobData } from '../queue.service';

@Processor('insights', {
  concurrency: parseInt(process.env.INSIGHTS_WORKER_CONCURRENCY || '3', 10),
})
export class InsightsProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private encryption: EncryptionService,
  ) {
    super();
  }

  async process(job: Job<InsightsJobData>): Promise<any> {
    const { igAccountId, igMediaIds } = job.data;
    
    this.logger.log(`Collecting insights for ${igMediaIds.length} media items`);

    try {
      const igAccount = await this.prisma.igAccount.findUnique({
        where: { id: igAccountId },
      });

      if (!igAccount) {
        throw new Error('Instagram account not found');
      }

      // Decrypt the access token (handle both encrypted and plain tokens)
      let decryptedAccessToken: string;
      try {
        decryptedAccessToken = this.encryption.decrypt(igAccount.accessToken);
      } catch (error) {
        this.logger.warn(`Token not encrypted for account, using as-is`);
        decryptedAccessToken = igAccount.accessToken;
      }

      const results = [];

      for (const igMediaId of igMediaIds) {
        try {
          const insights = await this.instagramService.getMediaInsights(
            igMediaId,
            decryptedAccessToken,
          );

          // Store insights in database
          await this.prisma.insight.create({
            data: {
              igAccountId,
              igMediaId,
              impressions: insights.impressions || 0,
              reach: insights.reach || 0,
              engagement: insights.engagement || 0,
              likes: insights.likes || 0,
              comments: insights.comments || 0,
              saves: insights.saved || 0,
              shares: insights.shares || 0,
              videoViews: insights.video_views || null,
              periodStart: new Date(),
              periodEnd: new Date(),
              rawData: insights,
            },
          });

          results.push({ igMediaId, success: true });
          this.logger.log(`✅ Collected insights for media ${igMediaId}`);
        } catch (error) {
          this.logger.error(`❌ Failed to collect insights for ${igMediaId}:`, error.message);
          results.push({ igMediaId, success: false, error: error.message });
        }
      }

      // Update last sync time
      await this.prisma.igAccount.update({
        where: { id: igAccountId },
        data: { lastSyncAt: new Date() },
      });

      return { results };
    } catch (error) {
      this.logger.error('Failed to collect insights:', error.message);
      throw error;
    }
  }
}
