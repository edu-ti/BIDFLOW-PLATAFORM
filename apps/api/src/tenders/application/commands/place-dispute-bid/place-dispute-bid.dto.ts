import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PlaceDisputeBidDto {
  @ApiProperty({ description: 'Bid amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Supplier ID making the bid' })
  @IsString()
  supplierId: string;
}
