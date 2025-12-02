import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);

  /**
   * List media files in a local folder
   */
  async listFilesInFolder(folderPath: string) {
    try {
      // Validate folder exists
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${folderPath} is not a directory`);
      }

      // Read all files in directory
      const files = await fs.readdir(folderPath);
      
      const mediaExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
        '.mp4', '.mov', '.avi', '.mkv', '.webm'   // Videos
      ];

      const mediaFiles = [];

      for (const fileName of files) {
        const filePath = path.join(folderPath, fileName);
        const ext = path.extname(fileName).toLowerCase();

        if (mediaExtensions.includes(ext)) {
          const fileStats = await fs.stat(filePath);
          const mimeType = this.getMimeType(ext);

          mediaFiles.push({
            id: fileName,
            name: fileName,
            mimeType,
            size: fileStats.size.toString(),
            fullPath: filePath,
          });
        }
      }

      return mediaFiles;
    } catch (error) {
      this.logger.error(`Failed to list files in folder ${folderPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Read file as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      this.logger.error(`Failed to read file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      return {
        id: fileName,
        name: fileName,
        mimeType: this.getMimeType(ext),
        size: stats.size.toString(),
        fullPath: filePath,
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync folder and return media assets data
   */
  async syncFolder(folderPath: string) {
    const files = await this.listFilesInFolder(folderPath);
    
    return files.map(file => ({
      driveFileId: file.name, // Use filename as unique ID
      fileName: file.name,
      mimeType: file.mimeType,
      fileSize: BigInt(file.size),
      thumbnailUrl: null,
      webViewLink: file.fullPath,
      width: null,
      height: null,
      duration: null,
    }));
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
