import { IsString, IsOptional } from 'class-validator';

export class UpdateThemeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  folderPath?: string;
}
