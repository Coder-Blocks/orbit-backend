import { IsNumber, IsString, Min } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  estimatedCost: number;
}
