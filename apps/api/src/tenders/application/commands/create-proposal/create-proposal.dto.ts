import { IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenderProposalItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;
}

export class CreateTenderProposalDto {
  @ApiProperty({ description: 'Valor final da proposta' })
  @IsNumber()
  totalValue: number;

  @ApiPropertyOptional({ description: 'Observações comerciais' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [TenderProposalItemDto], description: 'Itens discriminados da proposta' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenderProposalItemDto)
  items?: TenderProposalItemDto[];
}
