import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GoogleSheetsService } from './google-sheets.service';
import { GoogleSheetsLicenseService } from './google-sheets-license.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  providers: [GoogleDriveService, GoogleSheetsService, GoogleSheetsLicenseService, LocalStorageService],
  exports: [GoogleDriveService, GoogleSheetsService, GoogleSheetsLicenseService, LocalStorageService],
})
export class GoogleModule {}
