import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { PublishProcessor } from './processors/publish.processor';
import { InsightsProcessor } from './processors/insights.processor';
import { SchedulerService } from './scheduler.service';
import { InstagramModule } from '../instagram/instagram.module';
import { GoogleModule } from '../google/google.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
          password: configService.get('REDIS_PASSWORD') || undefined,
          db: parseInt(configService.get('REDIS_DB') || '0', 10),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'publish' },
      { name: 'insights' },
      { name: 'scheduler' },
    ),
    InstagramModule,
    GoogleModule,
    EncryptionModule,
  ],
  providers: [
    QueueService,
    PublishProcessor,
    InsightsProcessor,
    SchedulerService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
