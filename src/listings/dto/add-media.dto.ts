import { IsOptional, IsString } from 'class-validator';

export class AddMediaDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  angle?: string;
}
