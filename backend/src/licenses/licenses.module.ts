import { Module } from '@nestjs/common';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [PrismaModule, GoogleModule],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
