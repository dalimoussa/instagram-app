import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GoogleSheetsService } from './google-sheets.service';
import { GoogleSheetsLicenseService } from './google-sheets-license.service';

@Module({
  providers: [GoogleDriveService, GoogleSheetsService, GoogleSheetsLicenseService],
  exports: [GoogleDriveService, GoogleSheetsService, GoogleSheetsLicenseService],
})
export class GoogleModule {}
