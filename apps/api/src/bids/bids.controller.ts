import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto';

@ApiTags('Bids')
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bid' })
  create(@Body() createBidDto: CreateBidDto) {
    return this.bidsService.create(createBidDto);
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Get bids by auction ID' })
  findByAuction(@Param('auctionId') auctionId: string) {
    return this.bidsService.findByAuction(auctionId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get bids by user ID' })
  findByUser(@Param('userId') userId: string) {
    return this.bidsService.findByUser(userId);
  }
}