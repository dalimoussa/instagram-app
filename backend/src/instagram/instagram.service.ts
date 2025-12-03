import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { EncryptionService } from '../encryption/encryption.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

export interface PublishMediaParams {
  igUserId: string;
  accessToken: string;
  mediaBuffer: Buffer;
  mediaType: 'IMAGE' | 'VIDEO' | 'REEL';
  caption?: string;
  mimeType: string;
}

export interface MediaInsights {
  impressions?: number;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  saved?: number;
  shares?: number;
  video_views?: number;
  [key: string]: any;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly apiVersion: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private cloudinaryService: CloudinaryService,
    private appSettingsService: AppSettingsService,
  ) {
    this.apiVersion = this.configService.get('INSTAGRAM_API_VERSION') || 'v18.0';
    this.httpClient = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 30000,
    });
    
    // Set FFmpeg path
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await this.httpClient.get('/oauth/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: this.configService.get('INSTAGRAM_APP_SECRET'),
        access_token: shortLivedToken,
      },
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Get Instagram user profile
   */
  async getUserProfile(accessToken: string) {
    const response = await this.httpClient.get('/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken,
      },
    });

    return response.data;
  }

  /**
   * Get Instagram business accounts connected to a user
   */
  async getBusinessAccounts(accessToken: string) {
    const response = await this.httpClient.get('/me/accounts', {
      params: {
        access_token: accessToken,
      },
    });

    const pages = response.data.data;
    const igAccounts = [];

    for (const page of pages) {
      try {
        const igAccount = await this.httpClient.get(`/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: accessToken,
          },
        });

        if (igAccount.data.instagram_business_account) {
          igAccounts.push({
            pageId: page.id,
            pageName: page.name,
            igUserId: igAccount.data.instagram_business_account.id,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to get IG account for page ${page.id}`);
      }
    }

    return igAccounts;
  }

  /**
   * Publish media to Instagram
   */
  async publishMedia(params: PublishMediaParams): Promise<string> {
    const { igUserId, accessToken, mediaBuffer, mediaType, caption, mimeType } = params;

    // Access token is already decrypted by the caller
    const decryptedToken = accessToken;

    // Log media details
    this.logger.log(`📊 Media details: Type=${mediaType}, Size=${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB, MIME=${mimeType}`);

    // Validate video for Instagram requirements
    if (mediaType === 'VIDEO' || mediaType === 'REEL') {
      this.logger.warn(`⚠️ Instagram Reels requirements:
        - Max duration: 90 seconds
        - Codec: H.264
        - Resolution: 1080x1920 (9:16) or 1080x1080 (1:1)
        - Max size: 100MB
        - Format: MP4
      `);
      
      if (mediaBuffer.length > 100 * 1024 * 1024) {
        throw new Error(`Video too large: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB. Instagram limit is 100MB.`);
      }
    }

    // Step 1: Upload media to a temporary hosting (you'd need to implement this)
    // For production, upload to S3 or similar and get a public URL
    const mediaUrl = await this.uploadMediaToTemporaryHost(mediaBuffer, mimeType);

    // Step 2: Create media container
    const containerId = await this.createMediaContainer(
      igUserId,
      decryptedToken,
      mediaUrl,
      mediaType,
      caption,
    );

    // Step 3: Wait for media to be ready
    if (mediaType === 'VIDEO' || mediaType === 'REEL') {
      // For videos/reels, poll until ready
      await this.pollMediaStatus(containerId, decryptedToken);
    } else {
      // For images, wait 5 seconds for Instagram to process
      // Fixes error 2207027: "Media is not ready for publishing"
      this.logger.log('⏳ Waiting 5 seconds for Instagram to process image...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Step 4: Publish the media
    const igMediaId = await this.publishMediaContainer(igUserId, decryptedToken, containerId);

    return igMediaId;
  }

  /**
   * Create media container
   */
  private async createMediaContainer(
    igUserId: string,
    accessToken: string,
    mediaUrl: string,
    mediaType: string,
    caption?: string,
  ): Promise<string> {
    const params: any = {
      access_token: accessToken,
      caption: caption || '',
    };

    if (mediaType === 'IMAGE') {
      params.image_url = mediaUrl;
    } else if (mediaType === 'REEL' || mediaType === 'VIDEO') {
      // Instagram deprecated 'VIDEO' - use 'REELS' for all video content
      params.media_type = 'REELS';
      params.video_url = mediaUrl;
    } else {
      throw new Error(`Unsupported media type: ${mediaType}`);
    }

    try {
      this.logger.log(`Creating media container with params: ${JSON.stringify(params, null, 2)}`);
      const response = await this.httpClient.post(`/${igUserId}/media`, null, { params });
      this.logger.log(`✅ Media container created: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`❌ Failed to create media container:`, {
        error: error.response?.data || error.message,
        mediaUrl,
        igUserId,
        mediaType
      });
      throw error;
    }
  }

  /**
   * Poll media container status (for videos)
   */
  private async pollMediaStatus(containerId: string, accessToken: string): Promise<void> {
    const maxAttempts = 30; // 30 attempts = ~5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await this.httpClient.get(`/${containerId}`, {
        params: {
          fields: 'status_code,status',
          access_token: accessToken,
        },
      });

      const statusCode = response.data.status_code;
      const status = response.data.status;

      this.logger.log(`Polling media container ${containerId}: ${statusCode} (${status || 'processing'})`);

      if (statusCode === 'FINISHED') {
        this.logger.log(`✅ Media container ${containerId} encoding finished`);
        return;
      }

      if (statusCode === 'ERROR') {
        this.logger.error(`❌ Media encoding failed for ${containerId}:`, response.data);
        throw new Error(`Media encoding failed: ${status || 'Unknown error'}`);
      }

      // Wait 10 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    }

    throw new Error('Media encoding timeout - Instagram took too long to process');
  }

  /**
   * Publish media container
   */
  private async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    containerId: string,
  ): Promise<string> {
    try {
      this.logger.log(`Publishing media container ${containerId} for IG user ${igUserId}...`);
      
      const response = await this.httpClient.post(`/${igUserId}/media_publish`, null, {
        params: {
          creation_id: containerId,
          access_token: accessToken,
        },
      });

      this.logger.log(`✅ Media published successfully! ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`❌ Failed to publish media container ${containerId}:`);
      this.logger.error(`Instagram API Error:`, error.response?.data || error.message);
      this.logger.error(`Status Code:`, error.response?.status);
      this.logger.error(`Full Error:`, JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  /**
   * Refresh Instagram access token
   * https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens
   */
  async refreshAccessToken(currentToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: currentToken,
        },
      });

      this.logger.log(`✅ Instagram token refreshed, expires in ${response.data.expires_in}s`);
      
      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to refresh Instagram token:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(igMediaId: string, accessToken: string): Promise<MediaInsights> {
    // Access token is already decrypted by the caller
    const decryptedToken = accessToken;

    const metrics = [
      'impressions',
      'reach',
      'engagement',
      'likes',
      'comments',
      'saved',
      'shares',
      'video_views',
    ].join(',');

    try {
      const response = await this.httpClient.get(`/${igMediaId}/insights`, {
        params: {
          metric: metrics,
          access_token: decryptedToken,
        },
      });

      const insights: MediaInsights = {};

      response.data.data.forEach((item: any) => {
        insights[item.name] = item.values[0].value;
      });

      return insights;
    } catch (error) {
      this.logger.error(`Failed to get insights for ${igMediaId}:`, error.message);
      return {};
    }
  }

  /**
   * Optimize video for Instagram Reels requirements
   * - Codec: H.264 (most compatible)
   * - Resolution: 1080x1920 (9:16 vertical)
   * - FPS: 30
   * - Max duration: 60 seconds
   * - Audio: AAC codec
   */
  private async optimizeVideoForInstagram(inputBuffer: Buffer): Promise<Buffer> {
    const inputPath = path.join(process.cwd(), 'temp-media', `input-${uuidv4()}.mp4`);
    const outputPath = path.join(process.cwd(), 'temp-media', `output-${uuidv4()}.mp4`);

    try {
      // Ensure temp-media directory exists
      const tempDir = path.join(process.cwd(), 'temp-media');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write input buffer to file
      fs.writeFileSync(inputPath, inputBuffer);
      
      this.logger.log(`🎬 Optimizing video for Instagram (H.264, 1080x1920, max 60s)...`);

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .audioChannels(2)
          .audioFrequency(44100)
          .fps(30)
          .size('1080x1920')
          .videoBitrate('5000k')
          .audioBitrate('128k')
          .outputOptions([
            '-t', '60',
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
            '-preset medium',
            '-profile:v main',
            '-level 4.0',
            '-crf 23',
            '-pix_fmt yuv420p',
            '-movflags +faststart',
          ])
          .on('start', (commandLine) => {
            this.logger.log(`FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              this.logger.log(`Converting: ${progress.percent.toFixed(1)}%`);
            }
          })
          .on('end', () => {
            this.logger.log('✅ Video optimized successfully');
            
            // Read optimized file
            const optimizedBuffer = fs.readFileSync(outputPath);
            this.logger.log(`📹 Optimized size: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Cleanup temp files
            try {
              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);
            } catch (err) {
              this.logger.warn(`Cleanup warning: ${err.message}`);
            }
            
            resolve(optimizedBuffer);
          })
          .on('error', (err) => {
            this.logger.error(`❌ FFmpeg error: ${err.message}`);
            
            // Cleanup on error
            try {
              if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
              if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (cleanupErr) {
              this.logger.warn(`Cleanup error: ${cleanupErr.message}`);
            }
            
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error) {
      this.logger.error(`Video optimization failed: ${error.message}`);
      
      // Cleanup on exception
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (err) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Upload media to Cloudinary (production-ready CDN)
   * Replaces Imgur with professional, reliable hosting
   */
  private async uploadMediaToTemporaryHost(
    mediaBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const isVideo = mimeType.startsWith('video/');
    
    try {
      if (isVideo) {
        // Optimize video for Instagram before uploading
        this.logger.log(`📹 Original video: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        const optimizedBuffer = await this.optimizeVideoForInstagram(mediaBuffer);
        this.logger.log(`📹 Optimized video: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Try Cloudinary first
        try {
          const result = await this.cloudinaryService.uploadVideo(optimizedBuffer, {
            folder: 'instagram-reels',
          });

          this.logger.log(`✅ Video uploaded to Cloudinary: ${result.url}`);
          this.logger.log(`📦 Video hash: ${result.hash} (for caching)`);
          
          return result.url;
        } catch (cloudinaryError) {
          this.logger.error(`❌ Cloudinary failed: ${cloudinaryError.message}`);
          this.logger.warn(`⚠️ Attempting Imgur fallback...`);
          
          // Use optimized buffer for Imgur too
          return await this.uploadToImgurFallback(optimizedBuffer, mimeType);
        }
      } else {
        // Optimize image for Instagram before uploading
        this.logger.log(`📸 Original image: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        const optimizedBuffer = await this.optimizeImageForInstagram(mediaBuffer, mimeType);
        this.logger.log(`📸 Optimized image: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        try {
          const result = await this.cloudinaryService.uploadImage(optimizedBuffer, {
            folder: 'instagram-posts',
          });

          this.logger.log(`✅ Image uploaded to Cloudinary: ${result.url}`);
          return result.url;
        } catch (cloudinaryError) {
          this.logger.error(`❌ Cloudinary failed: ${cloudinaryError.message}`);
          this.logger.warn(`⚠️ Attempting Imgur fallback...`);
          return await this.uploadToImgurFallback(optimizedBuffer, mimeType);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Failed to upload media:`, error.message);
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }

  /**
   * Optimize image for Instagram
   * Instagram requires:
   * - Aspect ratio between 0.8 (4:5) and 1.91 (1.91:1)
   * - Min dimension: 320px
   * - Max size: 8MB
   * - Format: JPG or PNG
   */
  private async optimizeImageForInstagram(buffer: Buffer, mimeType: string): Promise<Buffer> {
    const sharp = require('sharp');
    
    try {
      const metadata = await sharp(buffer).metadata();
      this.logger.log(`📐 Original image: ${metadata.width}x${metadata.height}`);
      
      const aspectRatio = metadata.width / metadata.height;
      this.logger.log(`📐 Original aspect ratio: ${aspectRatio.toFixed(2)}`);
      
      let targetWidth = metadata.width;
      let targetHeight = metadata.height;
      
      // Instagram aspect ratio limits: 0.8 (4:5 portrait) to 1.91 (landscape)
      const MIN_ASPECT = 0.8;  // 4:5 portrait
      const MAX_ASPECT = 1.91; // ~1.91:1 landscape
      
      if (aspectRatio < MIN_ASPECT) {
        // Too tall - crop to 4:5
        this.logger.warn(`⚠️ Image too tall (${aspectRatio.toFixed(2)}), cropping to 4:5`);
        targetHeight = Math.floor(metadata.width / MIN_ASPECT);
        targetWidth = metadata.width;
      } else if (aspectRatio > MAX_ASPECT) {
        // Too wide - crop to 1.91:1
        this.logger.warn(`⚠️ Image too wide (${aspectRatio.toFixed(2)}), cropping to 1.91:1`);
        targetWidth = Math.floor(metadata.height * MAX_ASPECT);
        targetHeight = metadata.height;
      }
      
      // Ensure min dimension of 320px
      if (targetWidth < 320 || targetHeight < 320) {
        const scale = 320 / Math.min(targetWidth, targetHeight);
        targetWidth = Math.floor(targetWidth * scale);
        targetHeight = Math.floor(targetHeight * scale);
        this.logger.log(`📏 Scaling up to meet 320px minimum: ${targetWidth}x${targetHeight}`);
      }
      
      // Resize if dimensions changed
      let image = sharp(buffer);
      
      if (targetWidth !== metadata.width || targetHeight !== metadata.height) {
        this.logger.log(`✂️ Resizing to ${targetWidth}x${targetHeight} (aspect: ${(targetWidth / targetHeight).toFixed(2)})`);
        image = image.resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center',
        });
      }
      
      // Convert to JPEG with high quality
      const optimized = await image
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      
      this.logger.log(`✅ Image optimized: ${(optimized.length / 1024 / 1024).toFixed(2)} MB`);
      
      return optimized;
    } catch (error) {
      this.logger.error(`❌ Failed to optimize image:`, error.message);
      // Return original if optimization fails
      return buffer;
    }
  }

  /**
   * Fallback to Imgur if Cloudinary fails (temporary safety net)
   */
  private async uploadToImgurFallback(mediaBuffer: Buffer, mimeType: string): Promise<string> {
    const isVideo = mimeType.startsWith('video/');
    
    // Increased timeout for large uploads (5 minutes for video, 3 minutes for image)
    const timeout = isVideo ? 300000 : 180000;
    
    try {
      this.logger.log(`📤 Uploading to Imgur (${isVideo ? 'video' : 'image'}, ${(mediaBuffer.length / 1024 / 1024).toFixed(2)} MB, timeout: ${timeout / 1000}s)...`);
      
      const response = await axios.post(
        'https://api.imgur.com/3/upload',
        {
          [isVideo ? 'video' : 'image']: mediaBuffer.toString('base64'),
          type: 'base64',
        },
        {
          headers: {
            Authorization: 'Client-ID 546c25a59c58ad7',
          },
          timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const url = response.data.data.link;
      this.logger.log(`✅ Fallback: Uploaded to Imgur: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`❌ Imgur fallback also failed:`, error.message);
      throw new Error(`Both Cloudinary and Imgur failed: ${error.message}`);
    }
  }
}
