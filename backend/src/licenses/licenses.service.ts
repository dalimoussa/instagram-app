import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleSheetsLicenseService } from '../google/google-sheets-license.service';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleSheetsLicense: GoogleSheetsLicenseService,
  ) {}

  /**
   * Get current license status
   */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        licenseKey: true,
        _count: {
          select: {
            igAccounts: true,
            schedules: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If user has a license key, get plan limits from Google Sheets
    let planLimits = null;
    if (user.licenseKey) {
      try {
        planLimits = await this.googleSheetsLicense.getPlanLimits(user.licenseKey);
      } catch (error) {
        this.logger.warn(`Failed to get plan limits: ${error.message}`);
      }
    }

    return {
      plan: user.plan,
      licenseKey: user.licenseKey,
      currentUsage: {
        accounts: user._count.igAccounts,
        schedules: user._count.schedules,
      },
      planLimits: planLimits || {
        plan: user.plan,
        limits: {
          accounts: user.plan === 'FREE' ? 5 : user.plan === 'BASIC' ? 20 : user.plan === 'BUSINESS' ? 50 : 100,
          schedules: user.plan === 'FREE' ? 10 : user.plan === 'BASIC' ? 50 : user.plan === 'BUSINESS' ? 200 : 500,
          postsPerDay: user.plan === 'FREE' ? 20 : user.plan === 'BASIC' ? 100 : user.plan === 'BUSINESS' ? 500 : 1000,
        },
      },
    };
  }

  /**
   * Activate license key with Google Sheets validation
   * クライアント要件: 拡張機能起動時にライセンス認証を実施
   */
  async activate(licenseKey: string, userId: string) {
    // Validate license key format
    if (!licenseKey || licenseKey.length < 16) {
      throw new BadRequestException('Invalid license key format');
    }

    try {
      // Validate against Google Sheets
      const licenseData = await this.googleSheetsLicense.validateLicense(licenseKey);

      if (!licenseData.isActive) {
        throw new UnauthorizedException('License is not active');
      }

      if (licenseData.expiresAt < new Date()) {
        throw new UnauthorizedException('License has expired');
      }

      // Update or create license record in database
      await this.prisma.license.upsert({
        where: { licenseKey },
        create: {
          licenseKey,
          email: licenseData.email,
          plan: licenseData.plan,
          maxAccounts: licenseData.maxAccounts,
          maxSchedules: licenseData.maxSchedules,
          maxPostsPerDay: licenseData.maxPostsPerDay,
          isActive: true,
          validFrom: new Date(),
          validUntil: licenseData.expiresAt,
        },
        update: {
          email: licenseData.email,
          plan: licenseData.plan,
          maxAccounts: licenseData.maxAccounts,
          maxSchedules: licenseData.maxSchedules,
          maxPostsPerDay: licenseData.maxPostsPerDay,
          isActive: true,
          validUntil: licenseData.expiresAt,
          lastSyncedAt: new Date(),
        },
      });

      // Update user's license
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          licenseKey,
          plan: licenseData.plan,
        },
        select: {
          id: true,
          plan: true,
          licenseKey: true,
        },
      });

      this.logger.log(`License activated for user ${userId}: ${licenseData.plan} plan`);

      return {
        ...user,
        limits: {
          maxAccounts: licenseData.maxAccounts,
          maxSchedules: licenseData.maxSchedules,
          maxPostsPerDay: licenseData.maxPostsPerDay,
        },
        expiresAt: licenseData.expiresAt,
        features: licenseData.features,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`License activation failed: ${error.message}`);
      throw new BadRequestException('License validation failed');
    }
  }

  /**
   * Check if user can add account (50-100 account scale support)
   */
  async canAddAccount(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        licenseKey: true,
        _count: {
          select: {
            igAccounts: true,
          },
        },
      },
    });

    if (!user || !user.licenseKey) {
      return !user ? false : user._count.igAccounts < 5; // Free plan limit
    }

    return this.googleSheetsLicense.canAddAccount(user.licenseKey, user._count.igAccounts);
  }

  /**
   * Check if user can add schedule
   */
  async canAddSchedule(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        licenseKey: true,
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!user || !user.licenseKey) {
      return !user ? false : user._count.schedules < 10; // Free plan limit
    }

    return this.googleSheetsLicense.canAddSchedule(user.licenseKey, user._count.schedules);
  }
}
