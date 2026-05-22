import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenderController } from './api/controllers/tender.controller';
import { PrismaTenderRepository } from './infrastructure/persistence/prisma/prisma-tender.repository';
import { CaptureTenderHandler } from './application/commands/capture-tender/capture-tender.handler';

// Um provider simples para o event publisher caso não haja um global
class DummyEventPublisher {
  async publish(event: any): Promise<void> {
    console.log('[DummyEventPublisher] Event published:', event.type || event);
  }
  async publishAll(events: any[]): Promise<void> {
    for (const e of events) {
      await this.publish(e);
    }
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [TenderController],
  providers: [
    // 1. O repositório real
    {
      provide: 'TenderRepository',
      useClass: PrismaTenderRepository,
    },
    // 2. O Event Publisher abstrato (dummy para garantir a fiação por enquanto)
    {
      provide: 'TenderEventPublisher',
      useClass: DummyEventPublisher,
    },
    // 3. A injeção do Handler de domínio puro via factory
    {
      provide: CaptureTenderHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: DummyEventPublisher) => {
        return new CaptureTenderHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
  ],
  exports: ['TenderRepository', CaptureTenderHandler],
})
export class TendersModule {}
