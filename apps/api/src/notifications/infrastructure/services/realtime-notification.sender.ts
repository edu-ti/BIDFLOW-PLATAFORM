import { Injectable, Logger } from '@nestjs/common';
import { NotificationSender, NotificationPayload } from '../../application/ports/notification-sender.port';
import { NotificationGateway } from '../../api/gateways/notification.gateway';
import { PrismaService } from '../../../prisma/prisma.service'; 

@Injectable()
export class RealtimeNotificationSender implements NotificationSender {
  private readonly logger = new Logger(RealtimeNotificationSender.name);

  // 👈 2. Injeta o PrismaService no construtor ao lado do gateway
  constructor(
    private readonly gateway: NotificationGateway,
    private readonly prisma: PrismaService,
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    const { tenantId, level, message, metadata, recipientId } = payload;
    
    // Log estruturado no console
    const logOutput = {
      tenantId,
      recipientId: recipientId || 'ALL',
      level,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    const formattedLog = JSON.stringify(logOutput, null, 2);

    switch (level) {
      case 'CRITICAL':
        this.logger.error(`[NOTIFICATION DISPATCHED] -> ${formattedLog}`);
        break;
      case 'WARNING':
        this.logger.warn(`[NOTIFICATION DISPATCHED] -> ${formattedLog}`);
        break;
      case 'INFO':
      default:
        this.logger.log(`[NOTIFICATION DISPATCHED] -> ${formattedLog}`);
        break;
    }

    let savedNotification = { id: undefined };

    // 👈 3. PERSISTÊNCIA: Salva a notificação no Postgres 16 usando o Prisma
    try {
      savedNotification = await this.prisma.notification.create({
        data: {
          tenantId,
          level,
          message,
          metadata: metadata ? (metadata as any) : {}, // Garante compatibilidade com o campo Json do Prisma
          isRead: false,
        },
        select: { id: true }, // Busca apenas o ID para manter a operação ultra rápida
      });
    } catch (dbError) {
      this.logger.error(`[DATABASE ERROR] Failed to persist notification: ${dbError.message}`);
      // Dependendo da estratégia, você pode lançar o erro aqui para travar o fluxo se o banco falhar
    }

    // 👈 4. Disparo em tempo real via WebSockets injetando o ID do banco
    this.gateway.sendNotificationToTenant(tenantId, 'notification', {
      id: savedNotification.id, // O cockpit agora recebe o ID oficial do banco!
      level,
      message,
      metadata,
      timestamp: logOutput.timestamp
    });
  }
}