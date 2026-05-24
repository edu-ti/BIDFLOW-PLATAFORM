import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenderController } from './api/controllers/tender.controller';
import { PrismaTenderRepository } from './infrastructure/persistence/prisma/prisma-tender.repository';
import { RabbitMqTenderEventPublisher } from './infrastructure/event-publishers/rabbitmq-publisher';
import { CaptureTenderHandler } from './application/commands/capture-tender/capture-tender.handler';
import { SubmitProposalHandler } from './application/commands/submit-proposal/submit-proposal.handler';
import { PlaceDisputeBidHandler } from './application/commands/place-dispute-bid/place-dispute-bid.handler';
import { ProcessTenderResultHandler } from './application/commands/process-tender-result/process-tender-result.handler';
import { UploadTenderDocumentHandler } from './application/commands/upload-document/upload-document.handler';
import { ValidateTenderDocumentHandler } from './application/commands/validate-document/validate-document.handler';
import { IEventPublisher } from './application/ports/event-publisher.port';

@Module({
  imports: [PrismaModule],
  controllers: [TenderController],
  providers: [
    {
      provide: 'TenderRepository',
      useClass: PrismaTenderRepository,
    },
    {
      provide: 'TenderEventPublisher',
      useClass: RabbitMqTenderEventPublisher,
    },
    {
      provide: CaptureTenderHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new CaptureTenderHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
    {
      provide: SubmitProposalHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new SubmitProposalHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
    {
      provide: PlaceDisputeBidHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new PlaceDisputeBidHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
    {
      provide: ProcessTenderResultHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new ProcessTenderResultHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
    {
      provide: UploadTenderDocumentHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new UploadTenderDocumentHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
    {
      provide: ValidateTenderDocumentHandler,
      useFactory: (tenderRepo: PrismaTenderRepository, eventPublisher: IEventPublisher) => {
        return new ValidateTenderDocumentHandler(tenderRepo, eventPublisher);
      },
      inject: ['TenderRepository', 'TenderEventPublisher'],
    },
  ],
  exports: [
    'TenderRepository', 
    CaptureTenderHandler, 
    SubmitProposalHandler, 
    PlaceDisputeBidHandler, 
    ProcessTenderResultHandler,
    UploadTenderDocumentHandler,
    ValidateTenderDocumentHandler
  ],
})
export class TendersModule {}
