import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [EncryptionModule, CloudinaryModule, AppSettingsModule],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
