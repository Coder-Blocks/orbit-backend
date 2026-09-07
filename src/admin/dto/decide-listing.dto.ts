import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DecideListingDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
