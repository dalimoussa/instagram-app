import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [EncryptionModule, CloudinaryModule],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
