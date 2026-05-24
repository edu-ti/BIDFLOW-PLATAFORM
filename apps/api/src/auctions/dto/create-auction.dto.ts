// @ts-nocheck
import { IsString, IsNumber, IsEnum, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AuctionStatus } from '@prisma/client';

export class CreateAuctionDto {
  @ApiProperty({ example: 'Auction Title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Auction description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  startPrice: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;
}

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
  @ApiProperty({ enum: AuctionStatus, required: false })
  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;
}