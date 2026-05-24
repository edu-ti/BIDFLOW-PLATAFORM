import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateTenderDocumentDto {
  @ApiPropertyOptional({ example: 'Document signatures do not match', description: 'Reason for validation failure (used when invalidating)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
