import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import { AcceptTenderHandler } from './application/commands/accept-tender/accept-tender.handler';
import { GetTenderChecklistsHandler } from './application/queries/get-tender-checklists/get-tender-checklists.handler';
import { SubmitTenderAnalysisHandler } from './application/commands/submit-analysis/submit-analysis.handler';
import { CreateTenderProposalHandler } from './application/commands/create-proposal/create-proposal.handler';
import { AskTenderAiHandler } from './application/queries/ask-tender-ai/ask-tender-ai.handler';
import { SubmitBidToPortalHandler } from './application/commands/submit-bid-to-portal/submit-bid-to-portal.handler';
import { TenderProposalPdfService } from './application/services/tender-proposal-pdf.service';
import { IEventPublisher } from './application/ports/event-publisher.port';

@Module({
  imports: [PrismaModule, CqrsModule],
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
    AcceptTenderHandler,
    GetTenderChecklistsHandler,
    AskTenderAiHandler,
    SubmitTenderAnalysisHandler,
    CreateTenderProposalHandler,
    SubmitBidToPortalHandler,
    TenderProposalPdfService,
  ],
  exports: [
    'TenderRepository', 
    CaptureTenderHandler, 
    SubmitProposalHandler, 
    PlaceDisputeBidHandler, 
    ProcessTenderResultHandler,
    UploadTenderDocumentHandler,
    ValidateTenderDocumentHandler,
    AcceptTenderHandler
  ],
})
export class TendersModule {}
