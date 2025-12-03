import { 
  Controller, 
  Get, 
  Put, 
  Post,
  Body, 
  UseGuards, 
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AppSettingsService, AppSettingsDto } from './app-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

// Roles decorator
const Roles = (...roles: UserRole[]) => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata('roles', roles, descriptor ? descriptor.value : target);
    return descriptor;
  };
};

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppSettingsController {
  private readonly logger = new Logger(AppSettingsController.name);

  constructor(private readonly appSettingsService: AppSettingsService) {}

  /**
   * Get current app settings (admin only)
   * GET /api/v1/settings
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettings() {
    return this.appSettingsService.getSettings(false);
  }

  /**
   * Update app settings (admin only)
   * PUT /api/v1/settings
   */
  @Put()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateSettings(@Body() dto: AppSettingsDto) {
    this.logger.log('Updating app settings...');
    return this.appSettingsService.updateSettings(dto);
  }

  /**
   * Restart server (admin only)
   * POST /api/v1/settings/restart
   */
  @Post('restart')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  async restartServer() {
    this.logger.warn('Server restart requested by admin');
    
    // Send response first
    const response = {
      message: 'Server restart initiated. Please wait 10-15 seconds for the server to come back online.',
      status: 'restarting',
    };

    // Schedule restart after response is sent
    setTimeout(() => {
      this.logger.warn('Restarting server now...');
      process.exit(0); // PM2 or systemd will auto-restart
    }, 1000);

    return response;
  }

  /**
   * Get server status (for checking if server is back online after restart)
   * GET /api/v1/settings/status
   */
  @Get('status')
  async getStatus() {
    return {
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
