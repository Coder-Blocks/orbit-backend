import { IsOptional, IsString } from 'class-validator';

export class QueryItemsDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}
