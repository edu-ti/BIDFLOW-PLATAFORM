// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TenderStatus } from '../../../../../../../packages/domain/src/tenders/tender.aggregate';

export enum ResultStatus {
  WON = 'WON',
  LOST = 'LOST',
  APPEAL = 'APPEAL',
  DISQUALIFIED = 'DISQUALIFIED',
}

export class ProcessTenderResultDto {
  @ApiProperty({ enum: ResultStatus })
  @IsEnum(ResultStatus)
  status: TenderStatus;

  @ApiProperty()
  @IsNumber()
  classification: number;

  @ApiProperty()
  @IsNumber()
  winnerValue: number;

  @ApiProperty()
  @IsString()
  winnerName: string;

  @ApiProperty()
  @IsString()
  winnerDocument: string;

  @ApiProperty({ required: false })
  @IsOptional()
  rankings?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observations?: string;
}
