import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationEventsConsumer } from './api/consumers/notification-events.consumer';
import { NotificationController } from './api/notification.controller';
import { NotificationGateway } from './api/gateways/notification.gateway';
import { NOTIFICATION_SENDER } from './application/ports/notification-sender.port';
import { RealtimeNotificationSender } from './infrastructure/services/realtime-notification.sender';
import { TenderMatchService } from './infrastructure/services/tender-match.service';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [
    PrismaModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret-for-dev',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    NotificationEventsConsumer,
    NotificationController,
  ],
  providers: [
    NotificationGateway,
    TenderMatchService,
    {
      provide: NOTIFICATION_SENDER,
      useClass: RealtimeNotificationSender,
    },
  ],
  exports: [
    NOTIFICATION_SENDER,
    TenderMatchService,
  ],
})
export class NotificationsModule {}