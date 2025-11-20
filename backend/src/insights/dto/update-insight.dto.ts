import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateInsightDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  impressions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reach?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  engagement?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  likes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  comments?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  saves?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  shares?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  videoViews?: number;
}
