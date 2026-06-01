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

      // 2. Processamento Vetorial e Motor de Match com pgvector
      if (embedding && Array.isArray(embedding)) {
        // Agora o TenderMatchService lida com o save do vetor e a busca semântica em um único fluxo
        const matches = await this.matchService.processarNovoEditalEMatch(data, savedTender.id);

        this.logger.log(`[📊 DEBUG IA] Encontrados ${matches.length} possíveis matches para este PDF.`);
        if (matches.length > 0) {
          this.logger.log(`[📊 DEBUG IA] Maior similaridade encontrada para o Tenant: ${matches[0].affinityPercentage}%`);
        }

        // 3. DISPARO ÚNICO (Evita duplicações pegando o melhor score)
        if (matches.length > 0) {
          for (const match of matches) {
            await this.notificationSender.send({
              tenantId: match.tenantId,
              level: 'INFO',
              message: `🎯 MATCH SEMÂNTICO (${match.affinityPercentage}%)! O ${modality} nº ${data.number} da ${organization} está alinhado ao seu perfil de interesse!`,
              metadata: { tenderId: savedTender.id, similarity: match.affinityPercentage },
            });
            
            this.logger.log(`[🔔 NOTIFICAÇÃO] Alerta enviado para o Tenant interessado: ${match.tenantId}`);
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