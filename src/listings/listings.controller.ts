import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('items')
export class ListingsController {
  constructor(private listings: ListingsService) {}

  @Get()
  search(@Query() query: QueryItemsDto) {
    return this.listings.search(query);
  }

  // Declared before ':id' on purpose - Nest/Express match routes in
  // registration order, so a literal path like '/items/mine' has to come
  // before '/items/:id' or the param route would swallow it first.
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: any) {
    return this.listings.findMine(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listings.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateItemDto) {
    return this.listings.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media')
  addMedia(@Req() req: any, @Param('id') id: string, @Body() dto: AddMediaDto) {
    return this.listings.addMedia(id, req.user.userId, dto.url, dto.angle);
  }
}
