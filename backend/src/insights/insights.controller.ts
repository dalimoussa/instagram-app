import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  async getOverview(@Req() req: any) {
    return this.insightsService.getOverview(req.user.id);
  }

  @Get('ig-account/:id')
  async getAccountInsights(
    @Param('id') id: string,
    @Req() req: any,
    @Query('period') period?: string,
  ) {
    return this.insightsService.getAccountInsights(id, req.user.id, period);
  }

  @Get('ig-account/:id/history')
  async getPostHistory(@Param('id') id: string, @Req() req: any) {
    return this.insightsService.getPostHistory(id, req.user.id);
  }
}
