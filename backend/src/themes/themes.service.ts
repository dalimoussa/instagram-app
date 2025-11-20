import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from '../google/google-drive.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleDrive: GoogleDriveService,
  ) {}

  async create(createThemeDto: CreateThemeDto, userId: string) {
    // For now, skip Google Drive validation - will implement later
    // try {
    //   await this.googleDrive.getFolderInfo(createThemeDto.folderId);
    // } catch (error) {
    //   throw new BadRequestException('Invalid Google Drive folder ID');
    // }

    const theme = await this.prisma.theme.create({
      data: {
        userId,
        name: createThemeDto.name,
        description: createThemeDto.description,
        driveFolderId: createThemeDto.folderId,
      },
    });

    return theme;
  }

  async findAll(userId: string) {
    const themes = await this.prisma.theme.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return themes;
  }

  async findOne(id: string, userId: string) {
    const theme = await this.prisma.theme.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return theme;
  }

  async update(id: string, updateThemeDto: UpdateThemeDto, userId: string) {
    const theme = await this.prisma.theme.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Skip Google Drive validation for now
    // if (updateThemeDto.folderId) {
    //   try {
    //     await this.googleDrive.getFolderInfo(updateThemeDto.folderId);
    //   } catch (error) {
    //     throw new BadRequestException('Invalid Google Drive folder ID');
    //   }
    // }

    const updatedTheme = await this.prisma.theme.update({
      where: { id },
      data: {
        ...(updateThemeDto.name && { name: updateThemeDto.name }),
        ...(updateThemeDto.description && { description: updateThemeDto.description }),
        ...(updateThemeDto.folderId && { driveFolderId: updateThemeDto.folderId }),
      },
    });

    return updatedTheme;
  }

  async remove(id: string, userId: string) {
    const theme = await this.prisma.theme.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Delete related schedules first to avoid foreign key constraint
    await this.prisma.schedule.deleteMany({
      where: {
        themeId: id,
      },
    });

    // Delete theme (will cascade delete media assets)
    await this.prisma.theme.delete({
      where: { id },
    });

    return { message: 'Theme deleted successfully' };
  }

  /**
   * Sync media assets from Google Drive folder
   */
  async syncMediaAssets(id: string, userId: string) {
    const theme = await this.prisma.theme.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    try {
      // Get files from Google Drive
      const files = await this.googleDrive.syncFolder(theme.driveFolderId);

      if (files.length === 0) {
        return {
          message: 'No media files found in Google Drive folder',
          synced: 0,
          skipped: 0,
        };
      }

      let synced = 0;
      let skipped = 0;

      // Sync each file to database
      for (const file of files) {
        // Skip files with missing required data
        if (!file.driveFileId || !file.fileName || !file.mimeType) {
          skipped++;
          continue;
        }

        // Check if already exists
        const existing = await this.prisma.mediaAsset.findFirst({
          where: {
            themeId: id,
            driveFileId: file.driveFileId,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create new media asset (use upsert to handle duplicates)
        await this.prisma.mediaAsset.upsert({
          where: {
            driveFileId: file.driveFileId,
          },
          create: {
            themeId: id,
            driveFileId: file.driveFileId,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            thumbnailUrl: file.thumbnailUrl,
            webViewLink: file.webViewLink,
            width: file.width,
            height: file.height,
            duration: file.duration,
            isUsed: false,
          },
          update: {
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            thumbnailUrl: file.thumbnailUrl,
            webViewLink: file.webViewLink,
            width: file.width,
            height: file.height,
            duration: file.duration,
          },
        });

        synced++;
      }

      return {
        message: `Successfully synced ${synced} new media files`,
        synced,
        skipped,
        total: files.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to sync media from Google Drive: ${error.message}`,
      );
    }
  }
}
