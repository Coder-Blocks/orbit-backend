import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ListingsModule } from '../listings/listings.module';
import { DamageClaimsModule } from '../damage-claims/damage-claims.module';

@Module({
  imports: [ListingsModule, DamageClaimsModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
