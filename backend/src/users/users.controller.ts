import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    return this.usersService.update(req.user.id, updateUserDto);
  }
}
