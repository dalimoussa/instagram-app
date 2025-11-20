import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {
    this.logger.log('✅ SchedulerService initialized - cron jobs should start automatically');
  }

  async onModuleInit() {
    this.logger.log('✅ SchedulerService module initialized');
    // Start the scheduler manually since @Cron isn't working reliably
    this.startScheduler();
  }

  private startScheduler() {
    this.logger.log('🚀 Starting scheduler - will check for posts every minute');
    // Run immediately
    this.processSchedules();
    // Then run every minute
    setInterval(() => {
      this.processSchedules();
    }, 60 * 1000); // 60 seconds
  }

  /**
   * Run every minute to check for scheduled posts
   */
  async processSchedules() {
    this.logger.log('Checking for scheduled posts...');

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000); // Look back 1 minute
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find pending schedules that should be executed (past 1 min to future 5 min)
    const schedules = await this.prisma.schedule.findMany({
      where: {
        status: 'PENDING',
        scheduledTime: {
          gte: oneMinuteAgo,  // Changed from 'now' to catch recently executed schedules
          lte: fiveMinutesFromNow,
        },
      },
      include: {
        theme: {
          include: {
            mediaAssets: {
              where: { isUsed: false },
              take: 1,
            },
          },
        },
      },
    });

    if (schedules.length > 0) {
      this.logger.log(`📋 Found ${schedules.length} schedule(s) to process`);
    }

    for (const schedule of schedules) {
      this.logger.log(`Processing schedule ${schedule.id} for theme: ${schedule.theme.name}`);
      try {
        // Create posts for each target account
        for (const accountId of schedule.targetAccounts) {
          const mediaAsset = schedule.theme.mediaAssets[0];

          if (!mediaAsset) {
            this.logger.warn(`⚠️ No unused media available for schedule ${schedule.id}`);
            continue;
          }

          this.logger.log(`✅ Creating post for account ${accountId} with media ${mediaAsset.fileName}`);

          // Create post record
          const post = await this.prisma.post.create({
            data: {
              scheduleId: schedule.id,
              igAccountId: accountId,
              mediaAssetId: mediaAsset.id,
              caption: schedule.caption,
              hashtags: schedule.hashtags,
              postType: schedule.postType,
              status: 'QUEUED',
              scheduledFor: schedule.scheduledTime,
            },
          });

          // Add to publish queue
          await this.queueService.addPublishJob(
            {
              postId: post.id,
              igAccountId: accountId,
              mediaAssetId: mediaAsset.id,
              caption: schedule.caption || undefined,
              hashtags: schedule.hashtags,
            },
            schedule.scheduledTime,
          );
        }

        // Update schedule status
        await this.prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: 'PROCESSING' },
        });

        this.logger.log(`✅ Queued posts for schedule ${schedule.id}`);
      } catch (error) {
        this.logger.error(`❌ Failed to process schedule ${schedule.id}:`, error.message);
      }
    }
  }
}
