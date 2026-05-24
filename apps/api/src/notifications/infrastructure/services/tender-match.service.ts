import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface TenantMatchResult {
  tenant_id: string; // 👈 Agora retorna o ID do Tenant correspondente
  similarity: number;
}

@Injectable()
export class TenderMatchService {
  private readonly logger = new Logger(TenderMatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Varre os perfis de interesse de todos os Tenants e descobre
   * quem tem afinidade semântica com o edital capturado.
   */
  async findMatchingTenants(
    tenderEmbedding: number[],
    threshold = 85, // 85% de similaridade mínima
    limit = 10
  ): Promise<TenantMatchResult[]> {
    try {
      const vectorString = `[${tenderEmbedding.join(',')}]`;

      // Busca na tabela tenant_preferences usando a distância cosseno corrigida (* 100)
      const matches = await this.prisma.$queryRaw<TenantMatchResult[]>`
        SELECT 
          tenant_id,
          (1 - (embedding <=> ${vectorString}::vector)) * 100 as similarity
        FROM tenant_preferences
        WHERE (1 - (embedding <=> ${vectorString}::vector)) * 100 >= ${threshold}
        ORDER BY embedding <=> ${vectorString}::vector ASC
        LIMIT ${limit};
      `;

      return matches;
    } catch (error) {
      this.logger.error(`[AI MATCH ERROR] Falha na busca vetorial por Tenants: ${error.message}`);
      return [];
    }
  }
}