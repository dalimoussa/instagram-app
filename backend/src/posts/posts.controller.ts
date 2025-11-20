import { Controller, Get, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('scheduleId') scheduleId?: string,
    @Query('status') status?: string,
  ) {
    return this.postsService.findAll(req.user.id, scheduleId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.postsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.postsService.delete(id, req.user.id);
  }
}
