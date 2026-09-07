import { IsString } from 'class-validator';

export class DisputeClaimDto {
  @IsString()
  renterResponse: string;
}
