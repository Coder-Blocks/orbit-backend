import { IsNumber, IsString, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  title: string;

  @IsString()
  categoryId: string;

  @IsString()
  cityId: string;

  @IsNumber()
  @Min(1)
  dayPrice: number;

  @IsNumber()
  @Min(0)
  deposit: number;
}
