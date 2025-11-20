import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicensesService } from './licenses.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get('status')
  async getStatus(@Req() req: any) {
    return this.licensesService.getStatus(req.user.id);
  }

  @Post('activate')
  async activate(@Body() activateLicenseDto: ActivateLicenseDto, @Req() req: any) {
    return this.licensesService.activate(activateLicenseDto.licenseKey, req.user.id);
  }
}
