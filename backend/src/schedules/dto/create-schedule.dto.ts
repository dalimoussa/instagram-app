import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  themeId: string;

  @IsArray()
  @IsString({ each: true })
  targetAccounts: string[];

  @IsEnum(['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'])
  postType: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL';

  @IsDateString()
  scheduledTime: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurringPattern?: string;
}
