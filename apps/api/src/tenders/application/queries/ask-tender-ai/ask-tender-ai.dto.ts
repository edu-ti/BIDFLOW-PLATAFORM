import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskTenderAiDto {
  @ApiProperty({ description: 'A pergunta a ser feita ao assistente jurídico sobre o edital' })
  @IsString()
  @IsNotEmpty()
  question: string;
}
