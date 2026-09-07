import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(50)
  percent: number;
}
