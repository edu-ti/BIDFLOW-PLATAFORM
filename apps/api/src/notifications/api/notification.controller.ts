import { Controller, Get, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test-ai-match')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Configura o Tenant e o Usuário de teste no banco' })
  async testAiMatch() {
    const tenantId = 'tenant-teste-123';
    const userId = 'user-teste-123';

    // 1. Limpa registros antigos do ambiente de teste para evitar duplicados
    await this.prisma.$executeRawUnsafe(`DELETE FROM tenant_preferences WHERE tenant_id = '${tenantId}';`);
    await this.prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = '${userId}';`);

    // 2. Cria o Usuário de Teste exigido pelo Handshake do WebSocket
    // Nota: Ajuste os campos abaixo caso seu schema exija propriedades diferentes (ex: name, role)
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO users (id, tenant_id, email, name, role, created_at, updated_at)
      VALUES ('${userId}', '${tenantId}', 'eduardo@test.com', 'Eduardo Teste', 'USER', NOW(), NOW());
    `);

    // 3. Cria o vetor base de preferência em TI (768 dimensões)
    const preferenceVector = new Array(768).fill(0.1);
    preferenceVector[0] = 0.89; 
    preferenceVector[1] = 0.70;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO tenant_preferences (id, tenant_id, description, embedding, created_at)
      VALUES (gen_random_uuid(), '${tenantId}', 'Prestação de serviços de suporte técnico de informática e redes local', '[${preferenceVector.join(',')}]', NOW());
    `);

    return {
      status: 'Sucesso',
      message: 'Estrutura de teste recriada perfeitamente!',
      userCreated: userId,
      tenantId,
      preference: 'Prestação de serviços de suporte técnico de informática e redes local'
    };
  }
}