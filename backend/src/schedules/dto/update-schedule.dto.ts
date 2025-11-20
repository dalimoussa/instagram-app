import { IsString, IsDateString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  themeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetAccounts?: string[];

  @IsEnum(['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'])
  @IsOptional()
  postType?: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL';

  @IsDateString()
  @IsOptional()
  scheduledTime?: string;

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

  @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])
  @IsOptional()
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}
