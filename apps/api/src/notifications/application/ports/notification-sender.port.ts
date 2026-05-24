export interface NotificationPayload {
  tenantId: string;
  recipientId?: string; // Optional if broadcast to tenant
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
}

export const NOTIFICATION_SENDER = 'NOTIFICATION_SENDER';

export interface NotificationSender {
  send(payload: NotificationPayload): Promise<void>;
}
