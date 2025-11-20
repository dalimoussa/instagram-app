import { Module } from '@nestjs/common';
import { IgAccountsController } from './ig-accounts.controller';
import { IgAccountsService } from './ig-accounts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [PrismaModule, EncryptionModule, InstagramModule],
  controllers: [IgAccountsController],
  providers: [IgAccountsService],
  exports: [IgAccountsService],
})
export class IgAccountsModule {}
