import { Injectable, Logger } from '@nestjs/common';
import { NotificationSender, NotificationPayload } from '../../application/ports/notification-sender.port';

@Injectable()
export class ConsoleNotificationSender implements NotificationSender {
  private readonly logger = new Logger(ConsoleNotificationSender.name);

  async send(payload: NotificationPayload): Promise<void> {
    const { tenantId, level, message, metadata, recipientId } = payload;
    
    // Simulating structured log dispatch
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
  }
}
