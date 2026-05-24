import { Controller, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenderMatchService } from '../../infrastructure/services/tender-match.service';
import { NotificationSender, NOTIFICATION_SENDER } from '../../application/ports/notification-sender.port';

@Controller()
export class NotificationEventsConsumer {
  private readonly logger = new Logger(NotificationEventsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchService: TenderMatchService,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: NotificationSender,
  ) {}

  @EventPattern('bidflow.tender.v1.result_processed')
  async handleTenderProcessed(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`[🚀 NOVO EDITAL CAPTURADO] Processando fila para o Edital: ${data.number}`);

    try {
      const { externalId, organization, modality, title, embedding, tenantId } = data;

      // 1. Persiste o Edital com isolamento Multi-Tenant por chave composta
      const resolvedTenantId = tenantId || 'system';
      const savedTender = await this.prisma.tender.upsert({
        where: { 
          tenantId_externalId: {
            tenantId: resolvedTenantId,
            externalId
          } 
        },
        update: { title, organization, modality },
        create: {
          tenantId: resolvedTenantId,
          externalId,
          organization,
          modality,
          title,
          openingDate: new Date(),
          closingDate: new Date(),
          createdBy: 'RPA_PYTHON',
        },
      });

      // 2. Processamento Vetorial com pgvector
      if (embedding && Array.isArray(embedding)) {
        await this.prisma.tenderEmbedding.deleteMany({ where: { tenderId: savedTender.id } });

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO tender_embeddings (id, tender_id, embedding, created_at)
          VALUES (gen_random_uuid(), '${savedTender.id}', '[${embedding.join(',')}]', NOW());
        `);

        this.logger.log(`[🧠 IA] Embeddings guardados com sucesso para o Edital ID: ${savedTender.id}`);

        // 3. MOTOR DE MATCH (Busca com 85% de similaridade mínima)
        const tenantMatches = await this.matchService.findMatchingTenants(embedding, 85, 5);
          // 🔍 LOG TEMPORÁRIO DE DEBUG: Mostra o que o banco calculou
        this.logger.log(`[📊 DEBUG IA] Encontrados ${tenantMatches.length} possíveis matches para este PDF.`);
        if (tenantMatches.length > 0) {
          this.logger.log(`[📊 DEBUG IA] Maior similaridade encontrada para o Tenant: ${tenantMatches[0].similarity.toFixed(2)}%`);
        }
        // 4. DISPARO ÚNICO (Evita duplicações pegando o melhor score)
        if (tenantMatches.length > 0) {
          for (const match of tenantMatches) {
            await this.notificationSender.send({
              tenantId: match.tenant_id,
              level: 'INFO',
              message: `🎯 MATCH SEMÂNTICO (${match.similarity.toFixed(2)}%)! O ${modality} nº ${data.number} da ${organization} está alinhado ao seu perfil de interesse!`,
              metadata: { tenderId: savedTender.id, similarity: match.similarity },
            });
            
            this.logger.log(`[🔔 NOTIFICAÇÃO] Alerta enviado para o Tenant interessado: ${match.tenant_id}`);
          }
        } else {
          this.logger.log(`[🍃 IA] Edital ${data.number} processado, mas nenhum Tenant tem interesse semântico nele. Sem spam!`);
        }
      } // 👈 CHAVE CORRIGIDA AQUI: Fecha o bloco do processamento de embedding de forma isolada

      // Confirma a mensagem com sucesso no RabbitMQ para liberar o canal
      channel.ack(originalMsg);

    } catch (error) {
      this.logger.error(`[🚨 ERRO NO CONSUMER] Falha ao processar esteira de eventos: ${error.message}`);
      // Dá o ack no erro para evitar loops infinitos de reentrega em ambiente local
      channel.ack(originalMsg);
    }
  }
}