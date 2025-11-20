import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto, @Req() req: any) {
    return this.schedulesService.create(createScheduleDto, req.user.id);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.schedulesService.findAll(req.user.id);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Req() req: any) {
    return this.schedulesService.getExecutionStatus(id, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.schedulesService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: any,
  ) {
    return this.schedulesService.update(id, updateScheduleDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.schedulesService.remove(id, req.user.id);
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string, @Req() req: any) {
    return this.schedulesService.toggleActive(id, req.user.id);
  }

  @Post(':id/execute')
  async execute(@Param('id') id: string, @Req() req: any) {
    return this.schedulesService.executeNow(id, req.user.id);
  }
}
