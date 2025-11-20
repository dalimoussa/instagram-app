import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

export interface LicenseData {
  licenseKey: string;
  email: string;
  plan: 'FREE' | 'BASIC' | 'BUSINESS' | 'ENTERPRISE';
  maxAccounts: number;
  maxSchedules: number;
  maxPostsPerDay: number;
  isActive: boolean;
  expiresAt: Date;
  features: string[];
}

@Injectable()
export class GoogleSheetsLicenseService {
  private readonly logger = new Logger(GoogleSheetsLicenseService.name);
  private sheets: any;
  private spreadsheetId: string;

  constructor(private readonly config: ConfigService) {
    this.spreadsheetId = this.config.get('LICENSE_SPREADSHEET_ID') || '';
    this.initializeGoogleSheets();
  }

  private async initializeGoogleSheets() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.config.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
          private_key: this.config.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.logger.log('Google Sheets API initialized for license validation');
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets API:', error.message);
    }
  }

  /**
   * Validate license key against Google Spreadsheet
   * クライアント要件: Googleスプレッドシートを用いたライセンス照合システム
   */
  async validateLicense(licenseKey: string): Promise<LicenseData> {
    try {
      if (!this.sheets || !this.spreadsheetId) {
        this.logger.warn('Google Sheets not configured, skipping license validation');
        // Return default free plan if sheets not configured
        return this.getDefaultFreePlan(licenseKey);
      }

      // Read from spreadsheet (assuming structure: License Key | Email | Plan | Max Accounts | Max Schedules | Max Posts/Day | Active | Expires)
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Licenses!A2:I', // Skip header row
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        throw new UnauthorizedException('No licenses found in spreadsheet');
      }

      // Find matching license
      const licenseRow = rows.find((row: string[]) => row[0] === licenseKey);

      if (!licenseRow) {
        throw new UnauthorizedException('Invalid license key');
      }

      // Parse license data
      const [
        key,
        email,
        plan,
        maxAccounts,
        maxSchedules,
        maxPostsPerDay,
        isActive,
        expiresAt,
        features,
      ] = licenseRow;

      // Check if license is active
      if (isActive?.toLowerCase() !== 'true' && isActive !== '1') {
        throw new UnauthorizedException('License is inactive');
      }

      // Check expiry date
      const expiryDate = new Date(expiresAt);
      if (expiryDate < new Date()) {
        throw new UnauthorizedException('License has expired');
      }

      const licenseData: LicenseData = {
        licenseKey: key,
        email,
        plan: (plan?.toUpperCase() as any) || 'FREE',
        maxAccounts: parseInt(maxAccounts) || 5,
        maxSchedules: parseInt(maxSchedules) || 10,
        maxPostsPerDay: parseInt(maxPostsPerDay) || 50,
        isActive: true,
        expiresAt: expiryDate,
        features: features ? features.split(',').map((f: string) => f.trim()) : [],
      };

      this.logger.log(`License validated: ${email} - ${plan} plan (expires: ${expiresAt})`);
      
      return licenseData;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Failed to validate license:', error.message);
      throw new UnauthorizedException('License validation failed');
    }
  }

  /**
   * Check if user can add more accounts based on license
   */
  async canAddAccount(licenseKey: string, currentAccountCount: number): Promise<boolean> {
    const license = await this.validateLicense(licenseKey);
    return currentAccountCount < license.maxAccounts;
  }

  /**
   * Check if user can create more schedules based on license
   */
  async canAddSchedule(licenseKey: string, currentScheduleCount: number): Promise<boolean> {
    const license = await this.validateLicense(licenseKey);
    return currentScheduleCount < license.maxSchedules;
  }

  /**
   * Check if user can post more today based on license
   */
  async canPostToday(licenseKey: string, todayPostCount: number): Promise<boolean> {
    const license = await this.validateLicense(licenseKey);
    return todayPostCount < license.maxPostsPerDay;
  }

  /**
   * Get plan limits for display in UI
   */
  async getPlanLimits(licenseKey: string) {
    const license = await this.validateLicense(licenseKey);
    
    return {
      plan: license.plan,
      limits: {
        accounts: license.maxAccounts,
        schedules: license.maxSchedules,
        postsPerDay: license.maxPostsPerDay,
      },
      features: license.features,
      expiresAt: license.expiresAt,
      daysRemaining: Math.ceil((license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    };
  }

  /**
   * Default free plan when Google Sheets is not configured
   */
  private getDefaultFreePlan(licenseKey: string): LicenseData {
    return {
      licenseKey,
      email: 'demo@example.com',
      plan: 'FREE',
      maxAccounts: 5,
      maxSchedules: 10,
      maxPostsPerDay: 20,
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      features: ['basic_posting', 'analytics'],
    };
  }

  /**
   * Refresh license data from spreadsheet
   * Call this periodically or when user logs in
   */
  async refreshLicenseData(licenseKey: string): Promise<LicenseData> {
    return this.validateLicense(licenseKey);
  }
}
