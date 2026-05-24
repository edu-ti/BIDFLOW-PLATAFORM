import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterSupplierDto {
  @ApiProperty({ example: 'Tech Corp S.A.', description: 'The official corporate name of the supplier' })
  @IsString()
  @IsNotEmpty()
  corporateName: string;

  @ApiProperty({ example: 'Tech Solutions', description: 'The trade name of the supplier' })
  @IsString()
  @IsNotEmpty()
  tradeName: string;

  @ApiProperty({ example: '11.222.333/0001-81', description: 'The CNPJ document of the supplier, properly formatted or raw' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiPropertyOptional({ example: { phone: '+55 11 99999-9999' }, description: 'Additional metadata for the supplier' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
