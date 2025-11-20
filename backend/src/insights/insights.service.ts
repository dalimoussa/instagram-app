import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramService } from '../instagram/instagram.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instagram: InstagramService,
  ) {}

  async getOverview(userId: string) {
    const [totalPosts, pendingSchedules, igAccounts, totalThemes] = await Promise.all([
      this.prisma.post.count({
        where: {
          schedule: {
            userId,
          },
        },
      }),
      this.prisma.schedule.count({
        where: {
          userId,
          status: 'PENDING',
        },
      }),
      this.prisma.igAccount.count({
        where: {
          userId,
          isActive: true,
        },
      }),
      this.prisma.theme.count({
        where: {
          userId,
        },
      }),
    ]);

    const recentPosts = await this.prisma.post.findMany({
      where: {
        schedule: {
          userId,
        },
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 10,
    });

    return {
      totalPosts,
      pendingSchedules,
      igAccounts,
      totalThemes,
      recentPosts,
    };
  }

  /**
   * Get account insights with 再生数 (video views) tracking
   */
  async getAccountInsights(id: string, userId: string, period: string = '7d') {
    // Verify account ownership
    const account = await this.prisma.igAccount.findFirst({
      where: { id, userId },
    });

    if (!account) {
      return null;
    }

    // Calculate date range
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get insights from database
    const insights = await this.prisma.insight.aggregate({
      where: {
        igAccountId: id,
        collectedAt: {
          gte: startDate,
        },
      },
      _sum: {
        impressions: true,
        reach: true,
        engagement: true,
        likes: true,
        comments: true,
        saves: true,
        shares: true,
        videoViews: true, // 再生数
      },
      _count: true,
    });

    return {
      accountId: id,
      period,
      impressions: insights._sum.impressions || 0,
      reach: insights._sum.reach || 0,
      engagement: insights._sum.engagement || 0,
      likes: insights._sum.likes || 0,
      comments: insights._sum.comments || 0,
      saves: insights._sum.saves || 0,
      shares: insights._sum.shares || 0,
      videoViews: insights._sum.videoViews || 0, // Total 再生数 for reels/videos
      totalPosts: insights._count,
    };
  }

  /**
   * Collect insights for a specific published post
   * Track 再生数、投稿日時、ファイル名 as per client requirements
   */
  async collectPostInsights(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        igAccount: true,
        mediaAsset: true,
      },
    });

    if (!post || !post.igMediaId) {
      this.logger.warn(`Post ${postId} not found or not published yet`);
      return;
    }

    try {
      // Get insights from Instagram Graph API
      const insights = await this.instagram.getMediaInsights(
        post.igMediaId,
        post.igAccount.accessToken,
      );

      const now = new Date();
      
      // Create or update insight record
      await this.prisma.insight.upsert({
        where: {
          igMediaId_collectedAt: {
            igMediaId: post.igMediaId,
            collectedAt: now,
          },
        },
        create: {
          igAccountId: post.igAccountId,
          igMediaId: post.igMediaId,
          impressions: insights.impressions || 0,
          reach: insights.reach || 0,
          engagement: insights.engagement || 0,
          likes: insights.likes || 0,
          comments: insights.comments || 0,
          saves: insights.saved || 0,
          shares: insights.shares || 0,
          videoViews: insights.video_views || null, // 再生数 for reels/videos
          periodStart: now,
          periodEnd: now,
          rawData: insights,
        },
        update: {
          impressions: insights.impressions || 0,
          reach: insights.reach || 0,
          engagement: insights.engagement || 0,
          likes: insights.likes || 0,
          comments: insights.comments || 0,
          saves: insights.saved || 0,
          shares: insights.shares || 0,
          videoViews: insights.video_views || null,
          rawData: insights,
        },
      });

      this.logger.log(
        `Collected insights for post ${postId}: ${insights.video_views || 0} views`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to collect insights for post ${postId}: ${error.message}`,
      );
    }
  }

  /**
   * Auto-collect insights every 6 hours
   * Updates 再生数 automatically for all published posts
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async autoCollectInsights() {
    this.logger.log('Auto-collecting insights (再生数) for published posts...');

    // Get posts published in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: thirtyDaysAgo,
        },
        igMediaId: {
          not: null,
        },
      },
      include: {
        igAccount: true,
      },
      take: 100, // Process 100 posts at a time to avoid rate limits
    });

    this.logger.log(`Found ${posts.length} posts to collect insights for`);

    for (const post of posts) {
      try {
        await this.collectPostInsights(post.id);
        // Wait 1 second between API calls to avoid Instagram rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Failed for post ${post.id}: ${error.message}`);
      }
    }

    this.logger.log('Insight auto-collection completed');
  }

  /**
   * Get detailed post history for account detail screen
   * Shows: 投稿日時、ファイル名、ドライブURL、再生数
   */
  async getPostHistory(accountId: string, userId: string) {
    // Verify account ownership
    const account = await this.prisma.igAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return [];
    }

    const posts = await this.prisma.post.findMany({
      where: {
        igAccountId: accountId,
        status: 'PUBLISHED',
      },
      include: {
        mediaAsset: {
          select: {
            fileName: true,
            webViewLink: true,
            driveFileId: true,
          },
        },
        schedule: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Get latest insights for each post
    const postsWithInsights = await Promise.all(
      posts.map(async (post) => {
        let insights = null;
        
        if (post.igMediaId) {
          insights = await this.prisma.insight.findFirst({
            where: {
              igMediaId: post.igMediaId,
            },
            orderBy: {
              collectedAt: 'desc',
            },
          });
        }

        return {
          id: post.id,
          publishedAt: post.publishedAt, // 投稿日時
          fileName: post.mediaAsset?.fileName || 'Unknown', // ファイル名
          driveUrl: post.mediaAsset?.webViewLink || null, // ドライブURL
          videoViews: insights?.videoViews || 0, // 再生数
          likes: insights?.likes || 0,
          comments: insights?.comments || 0,
          shares: insights?.shares || 0,
          caption: post.caption,
          permalink: post.permalink,
          postType: post.postType,
          scheduleName: post.schedule?.name,
        };
      }),
    );

    return postsWithInsights;
  }
}
