import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly drive;

  constructor(private configService: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
        private_key: this.configService
          .get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * List files in a folder
   */
  async listFilesInFolder(folderId: string) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
        fields: 'files(id, name, mimeType, size, thumbnailLink, webViewLink, imageMediaMetadata, videoMediaMetadata)',
        orderBy: 'name',
      });

      return response.data.files || [];
    } catch (error) {
      this.logger.error(`Failed to list files in folder ${folderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Download file as buffer
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'arraybuffer' },
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, thumbnailLink, webViewLink, imageMediaMetadata, videoMediaMetadata',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${fileId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync folder and return media assets data
   */
  async syncFolder(folderId: string) {
    const files = await this.listFilesInFolder(folderId);
    
    return files.map(file => ({
      driveFileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      fileSize: file.size ? BigInt(file.size) : BigInt(0),
      thumbnailUrl: file.thumbnailLink || null,
      webViewLink: file.webViewLink || null,
      width: file.imageMediaMetadata?.width || file.videoMediaMetadata?.width || null,
      height: file.imageMediaMetadata?.height || file.videoMediaMetadata?.height || null,
      duration: file.videoMediaMetadata?.durationMillis 
        ? Math.floor(parseInt(file.videoMediaMetadata.durationMillis) / 1000) 
        : null,
    }));
  }
}
