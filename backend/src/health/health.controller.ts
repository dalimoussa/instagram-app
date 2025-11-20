import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    const checks: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      version: '1.0.0',
    };

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.services['database'] = {
        status: 'connected',
        type: 'PostgreSQL',
      };
    } catch (error) {
      checks.status = 'unhealthy';
      checks.services['database'] = {
        status: 'disconnected',
        error: error.message,
      };
    }

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'REDIS_HOST',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !this.config.get(envVar),
    );

    checks.services['environment'] = {
      status: missingEnvVars.length === 0 ? 'ok' : 'missing_variables',
      missing: missingEnvVars,
    };

    // Check Redis (optional - would need Redis client)
    checks.services['redis'] = {
      status: 'not_checked',
      note: 'Redis health check not implemented yet',
    };

    // Check Instagram API config
    checks.services['instagram'] = {
      status: 'configured',
      demoMode: !this.config.get('INSTAGRAM_APP_ID') || 
                this.config.get('INSTAGRAM_APP_ID') === '1130188699228533',
    };

    return checks;
  }

  @Get('stats')
  async getStats() {
    try {
      const [userCount, accountCount, themeCount, scheduleCount, postCount] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.igAccount.count(),
          this.prisma.theme.count(),
          this.prisma.schedule.count(),
          this.prisma.post.count(),
        ]);

      return {
        users: userCount,
        igAccounts: accountCount,
        themes: themeCount,
        schedules: scheduleCount,
        posts: postCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Failed to fetch stats',
        message: error.message,
      };
    }
  }

  @Get('demo-accounts')
  async getDemoAccounts() {
    try {
      const demoAccounts = await this.prisma.igAccount.findMany({
        where: {
          username: {
            startsWith: 'demo_user_',
          },
        },
        select: {
          id: true,
          username: true,
          igUserId: true,
          followersCount: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return {
        count: demoAccounts.length,
        accounts: demoAccounts,
      };
    } catch (error) {
      return {
        error: 'Failed to fetch demo accounts',
        message: error.message,
      };
    }
  }
}
