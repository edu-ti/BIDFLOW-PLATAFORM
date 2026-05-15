import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto, UpdateAuctionDto } from './dto';

@ApiTags('Auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new auction' })
  create(@Body() createAuctionDto: CreateAuctionDto) {
    return this.auctionsService.create(createAuctionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all auctions' })
  findAll() {
    return this.auctionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an auction by ID' })
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an auction' })
  update(@Param('id') id: string, @Body() updateAuctionDto: UpdateAuctionDto) {
    return this.auctionsService.update(id, updateAuctionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an auction' })
  remove(@Param('id') id: string) {
    return this.auctionsService.remove(id);
  }
}