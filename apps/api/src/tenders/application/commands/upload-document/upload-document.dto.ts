import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenderDocumentType } from '../../../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo';

export class UploadTenderDocumentDto {
  @ApiProperty({ enum: TenderDocumentType, example: TenderDocumentType.FISCAL_LABOR, description: 'Type of the document based on legal requirements' })
  @IsEnum(TenderDocumentType)
  @IsNotEmpty()
  type: TenderDocumentType;

  @ApiProperty({ example: 'Certidão Negativa de Débitos Federais', description: 'Title or description of the document' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://storage.bidflow.com/docs/cnd-123.pdf', description: 'URL of the uploaded file' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', description: 'Expiration date of the document if applicable' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
