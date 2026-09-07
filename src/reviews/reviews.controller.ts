import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('items/:itemId/reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get()
  forItem(@Param('itemId') itemId: string) {
    return this.reviews.forItem(itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Param('itemId') itemId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(itemId, dto.bookingId, dto.authorId, dto.rating, dto.body);
  }
}
