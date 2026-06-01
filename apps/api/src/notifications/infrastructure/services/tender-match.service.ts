import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface TenantMatchResult {
  tenantId: string;
  description: string;
  distance: number;
  affinityPercentage: number;
}

@Injectable()
export class TenderMatchService {
  private readonly logger = new Logger(TenderMatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processa o embedding recebido de um edital e busca os tenants com maior afinidade
   * baseando-se na distância de cosseno.
   * 
   * @param payload Payload contendo o array de embeddings gerado pelo modelo
   * @param tenderId O ID do edital correspondente
   */
  async processarNovoEditalEMatch(payload: any, tenderId: string): Promise<TenantMatchResult[]> {
    try {
      if (!payload?.embedding || !Array.isArray(payload.embedding)) {
        throw new Error('O payload não contém uma propriedade "embedding" válida (array numérico).');
      }

      // Converte o array de números em uma string de vetor compativel com pgvector
      const vectorString = `[${payload.embedding.join(',')}]`;

      // 1. Salva ou atualiza o vetor na tabela tender_embeddings
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO tender_embeddings (id, tender_id, embedding)
        VALUES (gen_random_uuid(), $1, $2::vector)
        ON CONFLICT (tender_id) 
        DO UPDATE SET embedding = EXCLUDED.embedding;
      `, tenderId, vectorString);

      this.logger.log(`Embedding salvo/atualizado com sucesso para o edital: ${tenderId}`);

      // 2. Executa a busca de proximidade semântica na tabela tenant_preferences
      // Utiliza o operador <=> (cosine distance) com limiar (threshold) < 0.35
      const matches: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          tenant_id, 
          description, 
          (embedding <=> $1::vector) AS distance
        FROM tenant_preferences
        WHERE (embedding <=> $1::vector) < 0.35
        ORDER BY (embedding <=> $1::vector) ASC;
      `, vectorString);

      // 3. Filtra, converte e calcula a afinidade (match) em porcentagem
      const result: TenantMatchResult[] = matches.map((match) => {
        const distance = typeof match.distance === 'number' ? match.distance : parseFloat(match.distance);
        const affinityPercentage = Math.round((1 - distance) * 100);

        return {
          tenantId: match.tenant_id,
          description: match.description,
          distance: distance,
          affinityPercentage: affinityPercentage,
        };
      });

      this.logger.log(`Foram encontrados ${result.length} tenants com match para o edital ${tenderId}`);

      return result;

    } catch (error) {
      this.logger.error(`Erro ao processar o matching semântico para o edital ${tenderId}`, error.stack);
      throw new InternalServerErrorException('Falha no motor de busca semântica para este edital.');
    }
  }
}