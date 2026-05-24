import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class SubmitProposalDto {
  @ApiProperty({ description: 'Total proposed value' })
  @IsNumber()
  totalValue: number;

  @ApiProperty({ description: 'Discount percentage', required: false })
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiProperty({ description: 'Item-level proposal values map' })
  @IsObject()
  @IsOptional()
  itemValues?: Record<string, number>;

  @ApiProperty({ description: 'Technical proposal description', required: false })
  @IsString()
  @IsOptional()
  technicalProposal?: string;

  @ApiProperty({ description: 'Commercial terms description', required: false })
  @IsString()
  @IsOptional()
  commercialTerms?: string;
}
