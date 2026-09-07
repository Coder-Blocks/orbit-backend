import { IsDateString, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  itemId: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
