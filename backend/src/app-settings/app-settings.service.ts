import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

export interface AppSettingsDto {
  instagramAppId?: string;
  instagramAppSecret?: string;
  instagramRedirectUri?: string;
  instagramApiVersion?: string;
  publicUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

@Injectable()
export class AppSettingsService implements OnModuleInit {
  private readonly logger = new Logger(AppSettingsService.name);
  private cachedSettings: AppSettingsDto | null = null;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    // Initialize default settings from environment variables if no settings exist
    await this.initializeDefaultSettings();
  }

  /**
   * Get current app settings (from database or fallback to env vars)
   */
  async getSettings(includeSecrets = false): Promise<AppSettingsDto> {
    // Check cache first
    if (this.cachedSettings && !includeSecrets) {
      return this.cachedSettings;
    }

    // Try to get from database
    const dbSettings = await this.prisma.appSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbSettings) {
      const settings: AppSettingsDto = {
        instagramAppId: dbSettings.instagramAppId || this.config.get('INSTAGRAM_APP_ID'),
        instagramAppSecret: includeSecrets 
          ? this.decryptSecret(dbSettings.instagramAppSecret) || this.config.get('INSTAGRAM_APP_SECRET')
          : '••••••••',
        instagramRedirectUri: dbSettings.instagramRedirectUri || this.config.get('INSTAGRAM_REDIRECT_URI'),
        instagramApiVersion: dbSettings.instagramApiVersion || this.config.get('INSTAGRAM_API_VERSION'),
        publicUrl: dbSettings.publicUrl || this.config.get('PUBLIC_URL'),
        cloudinaryCloudName: dbSettings.cloudinaryCloudName || this.config.get('CLOUDINARY_CLOUD_NAME'),
        cloudinaryApiKey: dbSettings.cloudinaryApiKey || this.config.get('CLOUDINARY_API_KEY'),
        cloudinaryApiSecret: includeSecrets
          ? this.decryptSecret(dbSettings.cloudinaryApiSecret) || this.config.get('CLOUDINARY_API_SECRET')
          : '••••••••',
      };

      // Cache settings (without secrets)
      if (!includeSecrets) {
        this.cachedSettings = settings;
      }

      return settings;
    }

    // Fallback to environment variables
    return this.getSettingsFromEnv(includeSecrets);
  }

  /**
   * Update app settings
   */
  async updateSettings(dto: AppSettingsDto): Promise<AppSettingsDto> {
    this.logger.log('Updating app settings...');

    // Encrypt secrets if provided
    const encryptedAppSecret = dto.instagramAppSecret && dto.instagramAppSecret !== '••••••••'
      ? this.encryption.encrypt(dto.instagramAppSecret)
      : null;

    const encryptedCloudinarySecret = dto.cloudinaryApiSecret && dto.cloudinaryApiSecret !== '••••••••'
      ? this.encryption.encrypt(dto.cloudinaryApiSecret)
      : null;

    // Deactivate old settings
    await this.prisma.appSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Get current settings to preserve secrets if not provided
    const currentSettings = await this.prisma.appSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // Create new settings record
    const newSettings = await this.prisma.appSettings.create({
      data: {
        instagramAppId: dto.instagramAppId,
        instagramAppSecret: encryptedAppSecret || currentSettings?.instagramAppSecret,
        instagramRedirectUri: dto.instagramRedirectUri,
        instagramApiVersion: dto.instagramApiVersion || 'v21.0',
        publicUrl: dto.publicUrl,
        cloudinaryCloudName: dto.cloudinaryCloudName,
        cloudinaryApiKey: dto.cloudinaryApiKey,
        cloudinaryApiSecret: encryptedCloudinarySecret || currentSettings?.cloudinaryApiSecret,
        isActive: true,
      },
    });

    // Clear cache
    this.cachedSettings = null;

    this.logger.log('App settings updated successfully');

    // Return masked settings
    return this.getSettings(false);
  }

  /**
   * Get Instagram API configuration for use in services
   */
  async getInstagramConfig(): Promise<{
    appId: string;
    appSecret: string;
    redirectUri: string;
    apiVersion: string;
    publicUrl: string;
  }> {
    const settings = await this.getSettings(true);

    return {
      appId: settings.instagramAppId || this.config.get('INSTAGRAM_APP_ID') || '',
      appSecret: settings.instagramAppSecret || this.config.get('INSTAGRAM_APP_SECRET') || '',
      redirectUri: settings.instagramRedirectUri || this.config.get('INSTAGRAM_REDIRECT_URI') || '',
      apiVersion: settings.instagramApiVersion || this.config.get('INSTAGRAM_API_VERSION') || 'v21.0',
      publicUrl: settings.publicUrl || this.config.get('PUBLIC_URL') || '',
    };
  }

  /**
   * Get Cloudinary configuration for use in services
   */
  async getCloudinaryConfig(): Promise<{
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  }> {
    const settings = await this.getSettings(true);

    return {
      cloudName: settings.cloudinaryCloudName || this.config.get('CLOUDINARY_CLOUD_NAME') || '',
      apiKey: settings.cloudinaryApiKey || this.config.get('CLOUDINARY_API_KEY') || '',
      apiSecret: settings.cloudinaryApiSecret || this.config.get('CLOUDINARY_API_SECRET') || '',
    };
  }

  /**
   * Initialize default settings from environment variables
   */
  private async initializeDefaultSettings() {
    const existingSettings = await this.prisma.appSettings.findFirst({
      where: { isActive: true },
    });

    if (!existingSettings) {
      this.logger.log('No settings found in database, initializing from environment variables...');

      const instagramAppSecret = this.config.get('INSTAGRAM_APP_SECRET');
      const cloudinaryApiSecret = this.config.get('CLOUDINARY_API_SECRET');

      await this.prisma.appSettings.create({
        data: {
          instagramAppId: this.config.get('INSTAGRAM_APP_ID'),
          instagramAppSecret: instagramAppSecret ? this.encryption.encrypt(instagramAppSecret) : null,
          instagramRedirectUri: this.config.get('INSTAGRAM_REDIRECT_URI'),
          instagramApiVersion: this.config.get('INSTAGRAM_API_VERSION', 'v21.0'),
          publicUrl: this.config.get('PUBLIC_URL'),
          cloudinaryCloudName: this.config.get('CLOUDINARY_CLOUD_NAME'),
          cloudinaryApiKey: this.config.get('CLOUDINARY_API_KEY'),
          cloudinaryApiSecret: cloudinaryApiSecret ? this.encryption.encrypt(cloudinaryApiSecret) : null,
          isActive: true,
        },
      });

      this.logger.log('Default settings initialized from environment variables');
    }
  }

  /**
   * Get settings from environment variables
   */
  private getSettingsFromEnv(includeSecrets = false): AppSettingsDto {
    return {
      instagramAppId: this.config.get('INSTAGRAM_APP_ID'),
      instagramAppSecret: includeSecrets 
        ? this.config.get('INSTAGRAM_APP_SECRET')
        : '••••••••',
      instagramRedirectUri: this.config.get('INSTAGRAM_REDIRECT_URI'),
      instagramApiVersion: this.config.get('INSTAGRAM_API_VERSION', 'v21.0'),
      publicUrl: this.config.get('PUBLIC_URL'),
      cloudinaryCloudName: this.config.get('CLOUDINARY_CLOUD_NAME'),
      cloudinaryApiKey: this.config.get('CLOUDINARY_API_KEY'),
      cloudinaryApiSecret: includeSecrets
        ? this.config.get('CLOUDINARY_API_SECRET')
        : '••••••••',
    };
  }

  /**
   * Decrypt a secret value
   */
  private decryptSecret(encrypted: string | null): string | null {
    if (!encrypted) return null;
    try {
      return this.encryption.decrypt(encrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt secret', error);
      return null;
    }
  }
}
