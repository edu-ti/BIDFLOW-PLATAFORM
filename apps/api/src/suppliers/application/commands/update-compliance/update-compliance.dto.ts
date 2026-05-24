import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupplierComplianceDto {
  @ApiProperty({ example: 85, description: 'The new compliance score between 0 and 100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  newScore: number;
}
