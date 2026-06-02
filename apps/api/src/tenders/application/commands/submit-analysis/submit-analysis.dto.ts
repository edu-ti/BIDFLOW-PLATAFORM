import { IsEnum, IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenderAnalysisRecommendation, TenderRiskLevel, TenderCompetitionLevel } from '@prisma/client';

export class SubmitTenderAnalysisDto {
  @ApiProperty({ enum: TenderAnalysisRecommendation })
  @IsEnum(TenderAnalysisRecommendation)
  recommendation: TenderAnalysisRecommendation;

  @ApiProperty({ enum: TenderRiskLevel })
  @IsEnum(TenderRiskLevel)
  riskLevel: TenderRiskLevel;

  @ApiProperty({ enum: TenderCompetitionLevel })
  @IsEnum(TenderCompetitionLevel)
  competitionLevel: TenderCompetitionLevel;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  conclusion: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  suggestedMargin?: number;
}
