import { IsNumber, Min } from 'class-validator';

export class ResolveClaimDto {
  @IsNumber()
  @Min(0)
  approvedAmount: number;
}
