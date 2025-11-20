import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [PrismaModule, InstagramModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
