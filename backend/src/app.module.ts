import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IgAccountsModule } from './ig-accounts/ig-accounts.module';
import { ThemesModule } from './themes/themes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PostsModule } from './posts/posts.module';
import { InsightsModule } from './insights/insights.module';
import { LicensesModule } from './licenses/licenses.module';
import { HealthModule } from './health/health.module';

// Infrastructure Modules
import { QueueModule } from './queue/queue.module';
import { GoogleModule } from './google/google.module';
import { InstagramModule } from './instagram/instagram.module';
import { EncryptionModule } from './encryption/encryption.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Schedule for cron jobs
    ScheduleModule.forRoot(),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    }]),
    
    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    IgAccountsModule,
    ThemesModule,
    SchedulesModule,
    PostsModule,
    InsightsModule,
    LicensesModule,
    HealthModule,
    
    // Infrastructure modules
    QueueModule,
    GoogleModule,
    InstagramModule,
    EncryptionModule,
  ],
})
export class AppModule {}
