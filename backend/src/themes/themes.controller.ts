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
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Controller('themes')
@UseGuards(JwtAuthGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Post()
  async create(@Body() createThemeDto: CreateThemeDto, @Req() req: any) {
    return this.themesService.create(createThemeDto, req.user.id);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.themesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.themesService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
    @Req() req: any,
  ) {
    return this.themesService.update(id, updateThemeDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.themesService.remove(id, req.user.id);
  }

  @Post(':id/sync')
  async syncMedia(@Param('id') id: string, @Req() req: any) {
    return this.themesService.syncMediaAssets(id, req.user.id);
  }
}
