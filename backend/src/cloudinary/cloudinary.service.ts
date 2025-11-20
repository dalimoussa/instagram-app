import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('✅ Cloudinary configured successfully');
  }

  /**
   * Upload video to Cloudinary with optimization
   * Returns a permanent, Instagram-compatible HTTPS URL
   */
  async uploadVideo(
    buffer: Buffer,
    options?: {
      postId?: string;
      folder?: string;
      hash?: string;
    },
  ): Promise<{ url: string; publicId: string; hash: string }> {
    try {
      // Generate SHA256 hash for deduplication
      const hash = options?.hash || this.generateHash(buffer);
      
      // Check if video already exists (caching)
      const existingVideo = await this.findByHash(hash);
      if (existingVideo) {
        this.logger.log(`📦 Using cached video: ${existingVideo.url}`);
        return existingVideo;
      }

      const folder = options?.folder || 'instagram-reels';
      const publicId = options?.postId 
        ? `${folder}/post-${options.postId}-${Date.now()}`
        : `${folder}/video-${Date.now()}`;

      this.logger.log(`⬆️ Uploading video to Cloudinary (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

      // For larger files (>10MB), use chunked upload for better reliability
      const fileSizeMB = buffer.length / 1024 / 1024;
      let result: UploadApiResponse;

      if (fileSizeMB > 10) {
        this.logger.log(`📦 Using chunked upload for large file (${fileSizeMB.toFixed(2)} MB)`);
        
        // Save buffer to temp file for chunked upload
        const tempPath = path.join(process.cwd(), 'temp-media', `upload-${Date.now()}.mp4`);
        await fs.promises.writeFile(tempPath, buffer);

        try {
          result = await cloudinary.uploader.upload_large(tempPath, {
            resource_type: 'video',
            folder,
            public_id: publicId,
            context: `hash=${hash}|uploaded_at=${new Date().toISOString()}`,
            tags: ['instagram', 'reel', 'auto-posted'],
            chunk_size: 6000000, // 6MB chunks
            timeout: 600000, // 10 minutes for very large files
          }) as UploadApiResponse;

          // Clean up temp file
          await fs.promises.unlink(tempPath).catch(() => {});
        } catch (error) {
          // Clean up temp file on error
          await fs.promises.unlink(tempPath).catch(() => {});
          throw error;
        }
      } else {
        // Use streaming upload for smaller files
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          // Set timeout for uploads (5 minutes)
          const uploadTimeout = setTimeout(() => {
            reject(new Error('Upload timeout after 5 minutes'));
          }, 300000);

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder,
              public_id: publicId,
              context: `hash=${hash}|uploaded_at=${new Date().toISOString()}`,
              tags: ['instagram', 'reel', 'auto-posted'],
              timeout: 300000, // 5 minutes
            },
            (error, result) => {
              clearTimeout(uploadTimeout);
              if (error) reject(error);
              else resolve(result!);
            },
          );

          uploadStream.end(buffer);
        });
      }

      const uploadedUrl = result.secure_url;

      this.logger.log(`✅ Video uploaded to Cloudinary: ${uploadedUrl}`);
      this.logger.log(`📊 Cloudinary video details:`, {
        publicId: result.public_id,
        format: result.format,
        duration: result.duration,
        size: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`,
      });

      // Pre-warm the CDN to ensure Instagram can access it immediately
      await this.prewarmCDN(uploadedUrl);

      return {
        url: uploadedUrl,
        publicId: result.public_id,
        hash,
      };
    } catch (error) {
      this.logger.error('❌ Failed to upload video to Cloudinary:');
      this.logger.error('Object:', JSON.stringify(error, null, 2));
      
      // More detailed error message
      let errorMessage = error.message || 'Unknown error';
      if (error.http_code === 499 || error.name === 'TimeoutError') {
        errorMessage = 'Upload timeout - file too large or slow connection';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      throw new Error(`Cloudinary upload failed: ${errorMessage}`);
    }
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    buffer: Buffer,
    options?: {
      postId?: string;
      folder?: string;
    },
  ): Promise<{ url: string; publicId: string }> {
    try {
      const folder = options?.folder || 'instagram-posts';
      const publicId = options?.postId 
        ? `${folder}/post-${options.postId}-${Date.now()}`
        : `${folder}/image-${Date.now()}`;

      this.logger.log(`⬆️ Uploading image to Cloudinary (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder,
            public_id: publicId,
            // Preserve original format and quality for Instagram
            format: 'jpg', // Instagram prefers JPG
            quality: '90', // High quality
            // Don't transform - preserve dimensions and aspect ratio
            flags: 'preserve_transparency',
            // Ensure metadata is preserved
            invalidate: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          },
        );

        uploadStream.end(buffer);
      });

      this.logger.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
      this.logger.log(`📐 Image dimensions: ${result.width}x${result.height} (aspect ratio: ${(result.width / result.height).toFixed(2)})`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error('❌ Failed to upload image to Cloudinary:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete media from Cloudinary
   */
  async deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'video'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      this.logger.log(`🗑️ Deleted media from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to delete media from Cloudinary: ${publicId}`, error);
      // Don't throw - deletion failures shouldn't break the flow
    }
  }

  /**
   * Generate SHA256 hash for buffer (for deduplication)
   */
  private generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Find video by hash (caching mechanism)
   * In production, this would query a database or Redis
   */
  private async findByHash(hash: string): Promise<{ url: string; publicId: string; hash: string } | null> {
    try {
      // Search Cloudinary for existing video with this hash
      // Note: Cloudinary Search API must be enabled in your account settings
      this.logger.log(`🔍 Checking Cloudinary cache for hash: ${hash.substring(0, 16)}...`);
      
      const result = await cloudinary.search
        .expression(`context:hash=${hash}`)
        .max_results(1)
        .execute();

      if (result.resources && result.resources.length > 0) {
        const resource = result.resources[0];
        this.logger.log(`♻️ Cache HIT! Reusing existing Cloudinary video`);
        return {
          url: resource.secure_url,
          publicId: resource.public_id,
          hash,
        };
      }

      this.logger.log(`📭 Cache MISS - will upload new video`);
      return null;
    } catch (error) {
      // If search fails (API not enabled or other error), just return null and proceed with upload
      this.logger.warn(`⚠️ Failed to search for cached video: ${error?.message || 'Unknown error'}`);
      this.logger.warn(`💡 Tip: Enable Cloudinary Search API in dashboard for caching support`);
      return null;
    }
  }

  /**
   * Pre-warm CDN by making a HEAD request
   * This ensures Instagram can access the video immediately
   */
  private async prewarmCDN(url: string): Promise<void> {
    try {
      const axios = require('axios');
      await axios.head(url, { timeout: 5000 });
      this.logger.log(`🔥 CDN pre-warmed: ${url}`);
      
      // Give CDN a moment to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      this.logger.warn(`⚠️ Failed to pre-warm CDN: ${error.message}`);
      // Non-critical, continue anyway
    }
  }

  /**
   * Get video details from Cloudinary
   */
  async getVideoDetails(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to get video details: ${publicId}`, error);
      throw error;
    }
  }

  /**
   * List all videos in a folder
   */
  async listVideos(folder: string = 'instagram-reels', maxResults: number = 100): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .max_results(maxResults)
        .execute();

      return result.resources || [];
    } catch (error) {
      this.logger.error(`❌ Failed to list videos in folder: ${folder}`, error);
      return [];
    }
  }

  /**
   * Clean up old videos (optional - for cost management)
   */
  async cleanupOldVideos(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const videos = await this.listVideos('instagram-reels', 500);
      let deletedCount = 0;

      for (const video of videos) {
        const createdAt = new Date(video.created_at);
        if (createdAt < cutoffDate) {
          await this.deleteMedia(video.public_id, 'video');
          deletedCount++;
        }
      }

      this.logger.log(`🧹 Cleaned up ${deletedCount} old videos`);
      return deletedCount;
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old videos:', error);
      return 0;
    }
  }
}
