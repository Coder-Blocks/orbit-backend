import { IsNumber, Min } from 'class-validator';

export class CreatePayoutDto {
  @IsNumber()
  @Min(0)
  amount: number;
}
