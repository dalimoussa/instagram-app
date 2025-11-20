import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InstagramService } from '../../instagram/instagram.service';
import { GoogleDriveService } from '../../google/google-drive.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { PublishJobData } from '../queue.service';

@Processor('publish', {
  concurrency: parseInt(process.env.PUBLISH_WORKER_CONCURRENCY || '5', 10),
})
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private googleDrive: GoogleDriveService,
    private encryption: EncryptionService,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<any> {
    const { postId, igAccountId, mediaAssetId, caption, hashtags } = job.data;
    
    this.logger.log(`Processing publish job ${job.id} for post ${postId}`);

    try {
      // Update post status to PROCESSING
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'PROCESSING' },
      });

      // Get IG account with decrypted token
      const igAccount = await this.prisma.igAccount.findUnique({
        where: { id: igAccountId },
      });

      if (!igAccount || !igAccount.isActive) {
        throw new Error('Instagram account not found or inactive');
      }

      // Decrypt the access token (handle both encrypted and plain tokens)
      let decryptedAccessToken: string;
      try {
        // Try to decrypt (new format: encrypted tokens)
        decryptedAccessToken = this.encryption.decrypt(igAccount.accessToken);
        this.logger.log(`✅ Decrypted access token for account ${igAccount.username}`);
      } catch (error) {
        // Fallback: token might be in plain text (old format or demo accounts)
        this.logger.warn(`Token not encrypted for account ${igAccount.username}, using as-is`);
        decryptedAccessToken = igAccount.accessToken;
      }

      // Validate token format - detect mock tokens from old code
      if (decryptedAccessToken.startsWith('refreshed_') || decryptedAccessToken.length < 50) {
        this.logger.error(`❌ INVALID TOKEN for account ${igAccount.username}: Mock or corrupted token detected`);
        
        // Mark post as failed with helpful message
        await this.prisma.post.update({
          where: { id: postId },
          data: { 
            status: 'FAILED',
            publishedAt: null,
          },
        });
        
        // Deactivate the Instagram account to prevent further failures
        await this.prisma.igAccount.update({
          where: { id: igAccountId },
          data: { isActive: false },
        });
        
        throw new Error(
          `Invalid Instagram token for account ${igAccount.username}. ` +
          `The account has been deactivated. Please reconnect your Instagram account via the UI to get a fresh token.`
        );
      }

      // Get media asset
      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { id: mediaAssetId },
      });

      if (!mediaAsset) {
        throw new Error('Media asset not found');
      }

      // Download media from Google Drive
      this.logger.log(`Downloading media from Drive: ${mediaAsset.fileName}`);
      const mediaBuffer = await this.googleDrive.downloadFile(mediaAsset.driveFileId);

      // Publish to Instagram
      const postType = await this.detectPostType(mediaAsset);
      const fullCaption = this.buildCaption(caption, hashtags);

      this.logger.log(`Publishing ${postType} to Instagram account ${igAccount.username}`);
      
      const igMediaId = await this.instagramService.publishMedia({
        igUserId: igAccount.igUserId,
        accessToken: decryptedAccessToken,
        mediaBuffer,
        mediaType: postType,
        caption: fullCaption,
        mimeType: mediaAsset.mimeType,
      });

      // Update post record
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          igMediaId,
          publishedAt: new Date(),
        },
      });

      // Mark media as used
      await this.prisma.mediaAsset.update({
        where: { id: mediaAssetId },
        data: {
          isUsed: true,
          lastUsedAt: new Date(),
        },
      });

      this.logger.log(`✅ Successfully published post ${postId}`);

      return { success: true, igMediaId };
    } catch (error) {
      this.logger.error(`❌ Failed to publish post ${postId}:`, error.message);

      // Update post with error
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  private async detectPostType(mediaAsset: any): Promise<'IMAGE' | 'VIDEO' | 'REEL'> {
    if (mediaAsset.mimeType.startsWith('image/')) {
      return 'IMAGE';
    }
    
    if (mediaAsset.mimeType.startsWith('video/')) {
      // Instagram deprecated 'VIDEO' media_type - all videos must use 'REEL' now
      // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating
      return 'REEL';
    }
    
    return 'IMAGE';
  }

  private buildCaption(caption?: string, hashtags?: string[]): string {
    let fullCaption = caption || '';
    
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      fullCaption = fullCaption ? `${fullCaption}\n\n${hashtagString}` : hashtagString;
    }
    
    return fullCaption;
  }
}
