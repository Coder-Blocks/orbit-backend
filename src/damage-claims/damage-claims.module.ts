import { Module } from '@nestjs/common';
import { DamageClaimsService } from './damage-claims.service';
import { DamageClaimsController } from './damage-claims.controller';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  providers: [DamageClaimsService],
  controllers: [DamageClaimsController],
  exports: [DamageClaimsService],
})
export class DamageClaimsModule {}
