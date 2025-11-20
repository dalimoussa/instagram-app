import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

interface LicenseRow {
  licenseKey: string;
  email: string;
  plan: string;
  maxAccounts: number;
  maxSchedules: number;
  maxPostsPerDay: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  rowNumber: number;
}

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private readonly sheets;
  private readonly spreadsheetId: string;
  private readonly sheetName: string;

  constructor(private configService: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
        private_key: this.configService
          .get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = this.configService.get('LICENSE_SHEET_ID') || '';
    this.sheetName = this.configService.get('LICENSE_SHEET_NAME') || 'licenses';
  }

  /**
   * Fetch all license data from Google Sheets
   * Expected columns: License Key | Email | Plan | Max Accounts | Max Schedules | Max Posts/Day | Active | Valid From | Valid Until
   */
  async fetchLicenses(): Promise<LicenseRow[]> {
    try {
      const range = `${this.sheetName}!A2:I`; // Skip header row
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      
      return rows.map((row, index) => ({
        licenseKey: row[0] || '',
        email: row[1] || '',
        plan: row[2] || 'FREE',
        maxAccounts: parseInt(row[3]) || 1,
        maxSchedules: parseInt(row[4]) || 5,
        maxPostsPerDay: parseInt(row[5]) || 10,
        isActive: row[6]?.toLowerCase() === 'true' || row[6] === '1',
        validFrom: this.parseDate(row[7]),
        validUntil: this.parseDate(row[8]),
        rowNumber: index + 2, // +2 because we start from row 2
      }));
    } catch (error) {
      this.logger.error('Failed to fetch licenses from Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Verify a single license by key
   */
  async verifyLicense(licenseKey: string): Promise<LicenseRow | null> {
    const licenses = await this.fetchLicenses();
    
    const license = licenses.find(l => l.licenseKey === licenseKey);
    
    if (!license) {
      return null;
    }

    // Check if license is valid
    const now = new Date();
    if (!license.isActive || license.validUntil < now) {
      return null;
    }

    return license;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateString: string): Date {
    if (!dateString) {
      return new Date();
    }

    // Try ISO format first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try MM/DD/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return new Date();
  }
}
