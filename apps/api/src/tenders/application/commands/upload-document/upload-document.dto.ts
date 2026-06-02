import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenderDocumentCategory } from '@prisma/client';

export class UploadTenderDocumentDto {
  @ApiPropertyOptional({ description: 'ID do item de checklist a que este documento responde' })
  @IsOptional()
  @IsString()
  checklistItemId?: string;

  @ApiProperty({ enum: TenderDocumentCategory, description: 'Categoria do documento (ex: HABILITACAO, TECNICA)' })
  @IsEnum(TenderDocumentCategory)
  category: TenderDocumentCategory;
}
