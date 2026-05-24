import { Controller, Get, Param, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test-ai-match')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Configura o Perfil de Interesse de TI do Tenant para testes' })
  async testAiMatch() {
    const tenantId = 'tenant-teste-123';

    // 1. Limpa preferências antigas do teste para não duplicar
    await this.prisma.$executeRawUnsafe(`DELETE FROM tenant_preferences WHERE tenant_id = '${tenantId}';`);

    // 2. Cria o vetor base simulado de interesse em TI do cliente (Forte ativação no início)
    const preferenceVector = new Array(768).fill(0.1);
    preferenceVector[0] = 0.89; 
    preferenceVector[1] = 0.70;

    // 3. Insere a preferência do cliente no banco via SQL Bruto por conta do campo Unsupported
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO tenant_preferences (id, tenant_id, description, embedding, created_at)
      VALUES (gen_random_uuid(), '${tenantId}', 'Prestação de serviços de suporte técnico de informática e redes local', '[${preferenceVector.join(',')}]', NOW());
    `);

    return {
      message: 'Perfil de interesse do Tenant configurado com sucesso!',
      tenantId,
      interesseCadastrado: 'Prestação de serviços de suporte técnico de informática e redes local',
    };
  }
}