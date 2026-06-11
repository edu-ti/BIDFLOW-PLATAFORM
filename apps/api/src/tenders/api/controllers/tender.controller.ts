import { Controller, Post, Patch, Get, Body, Param, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentTenant } from '../../../workflow/api/guards/current-tenant.decorator';
import { CaptureTenderDto } from '../../application/commands/capture-tender/capture-tender.dto';
import { CaptureTenderCommand } from '../../application/commands/capture-tender/capture-tender.command';
import { CaptureTenderHandler } from '../../application/commands/capture-tender/capture-tender.handler';

import { SubmitProposalDto } from '../../application/commands/submit-proposal/submit-proposal.dto';
import { SubmitProposalCommand } from '../../application/commands/submit-proposal/submit-proposal.command';
import { SubmitProposalHandler } from '../../application/commands/submit-proposal/submit-proposal.handler';

import { PlaceDisputeBidDto } from '../../application/commands/place-dispute-bid/place-dispute-bid.dto';
import { PlaceDisputeBidCommand } from '../../application/commands/place-dispute-bid/place-dispute-bid.command';
import { PlaceDisputeBidHandler } from '../../application/commands/place-dispute-bid/place-dispute-bid.handler';

import { ProcessTenderResultDto } from '../../application/commands/process-tender-result/process-tender-result.dto';
import { ProcessTenderResultCommand } from '../../application/commands/process-tender-result/process-tender-result.command';
import { ProcessTenderResultHandler } from '../../application/commands/process-tender-result/process-tender-result.handler';

import { UploadTenderDocumentDto } from '../../application/commands/upload-document/upload-document.dto';
import { UploadTenderDocumentCommand } from '../../application/commands/upload-document/upload-document.command';
import { UploadTenderDocumentHandler } from '../../application/commands/upload-document/upload-document.handler';
import { ValidateTenderDocumentDto } from '../../application/commands/validate-document/validate-document.dto';
import { ValidateTenderDocumentCommand } from '../../application/commands/validate-document/validate-document.command';
import { ValidateTenderDocumentHandler } from '../../application/commands/validate-document/validate-document.handler';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AcceptTenderDto } from '../../application/commands/accept-tender/accept-tender.dto';
import { AcceptTenderCommand } from '../../application/commands/accept-tender/accept-tender.command';
import { GetTenderChecklistsQuery } from '../../application/queries/get-tender-checklists/get-tender-checklists.query';
import { SubmitTenderAnalysisDto } from '../../application/commands/submit-analysis/submit-analysis.dto';
import { SubmitTenderAnalysisCommand } from '../../application/commands/submit-analysis/submit-analysis.command';
import { CreateTenderProposalDto } from '../../application/commands/create-proposal/create-proposal.dto';
import { CreateTenderProposalCommand } from '../../application/commands/create-proposal/create-proposal.command';
import { AskTenderAiDto } from '../../application/queries/ask-tender-ai/ask-tender-ai.dto';
import { AskTenderAiQuery } from '../../application/queries/ask-tender-ai/ask-tender-ai.query';
import { SubmitBidToPortalCommand } from '../../application/commands/submit-bid-to-portal/submit-bid-to-portal.command';
import { TenderProposalPdfService } from '../../application/services/tender-proposal-pdf.service';
import { HttpStatus, HttpCode } from '@nestjs/common';

@ApiTags('Tenders')
@ApiBearerAuth()
@Controller('v1/tenders')
export class TenderController {
  constructor(
    private readonly captureTenderHandler: CaptureTenderHandler,
    private readonly submitProposalHandler: SubmitProposalHandler,
    private readonly placeDisputeBidHandler: PlaceDisputeBidHandler,
    private readonly processTenderResultHandler: ProcessTenderResultHandler,
    private readonly uploadTenderDocumentHandler: UploadTenderDocumentHandler,
    private readonly validateTenderDocumentHandler: ValidateTenderDocumentHandler,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tenderProposalPdfService: TenderProposalPdfService,
  ) {}

  @Post('capture')
  async capture(@Body() dto: CaptureTenderDto, @CurrentTenant() tenant: any) {
    const command = new CaptureTenderCommand(
      tenant.tenantId,
      dto.externalId,
      dto.source,
      dto.number,
      dto.organization,
      dto.department,
      dto.modality,
      dto.type,
      dto.title,
      dto.description,
      dto.uf,
      dto.city,
      dto.estimatedValue,
      dto.currency,
      new Date(dto.openingDate),
      new Date(dto.closingDate),
      dto.documentUrl,
      tenant.userId || dto.createdBy,
    );

    return this.captureTenderHandler.execute(command);
  }

  @Post(':id/proposal')
  async submitProposal(
    @Param('id') tenderId: string,
    @Body() dto: SubmitProposalDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new SubmitProposalCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto.totalValue,
      dto.discountPercent,
      dto.itemValues,
      dto.technicalProposal,
      dto.commercialTerms,
    );

    await this.submitProposalHandler.execute(command);
    return { success: true, message: 'Proposal submitted successfully' };
  }

  @Post(':id/dispute/bids')
  async placeDisputeBid(
    @Param('id') tenderId: string,
    @Body() dto: PlaceDisputeBidDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new PlaceDisputeBidCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto.amount,
      dto.supplierId,
    );

    await this.placeDisputeBidHandler.execute(command);
    return { success: true, message: 'Bid placed successfully' };
  }

  @Post(':id/result')
  async processResult(
    @Param('id') tenderId: string,
    @Body() dto: ProcessTenderResultDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new ProcessTenderResultCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto.status,
      dto.classification,
      dto.winnerValue,
      dto.winnerName,
      dto.winnerDocument,
      dto.rankings,
      dto.observations,
    );

    await this.processTenderResultHandler.execute(command);
    return { success: true, message: 'Tender result processed successfully' };
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a compliance document for a tender' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Tender not found or file missing' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') tenderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTenderDocumentDto,
    @CurrentTenant() tenant: any,
  ) {
    if (!file) {
      throw new BadRequestException('Ficheiro não fornecido.');
    }

    const command = new UploadTenderDocumentCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      file,
      dto,
    );

    const documentId = await this.commandBus.execute(command);
    return { success: true, message: 'Document uploaded successfully', documentId };
  }

  @Patch(':id/documents/:documentId/validate')
  @ApiOperation({ summary: 'Validate or invalidate a tender document' })
  @ApiResponse({ status: 200, description: 'Document validated successfully' })
  @ApiResponse({ status: 400, description: 'Tender or Document not found' })
  async validateDocument(
    @Param('id') tenderId: string,
    @Param('documentId') documentId: string,
    @Body() dto: ValidateTenderDocumentDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new ValidateTenderDocumentCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      documentId,
      dto.reason,
    );

    await this.validateTenderDocumentHandler.execute(command);
    return { success: true, message: 'Document validated successfully' };
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a tender and convert it into a CRM Opportunity' })
  @ApiResponse({ status: 201, description: 'Tender accepted and Opportunity created' })
  @ApiResponse({ status: 404, description: 'Tender not found' })
  async acceptTender(
    @Param('id') tenderId: string,
    @Body() dto: AcceptTenderDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new AcceptTenderCommand(
      tenderId,
      tenant.tenantId,
    );

    // Despacha o comando através do CommandBus
    return this.commandBus.execute(command);
  }

  @Get(':id/checklists')
  @ApiOperation({ summary: 'Obtém a checklist de documentos e tarefas de um edital' })
  @ApiResponse({ status: 200, description: 'Checklist obtida com sucesso' })
  async getChecklists(
    @Param('id') tenderId: string,
    @CurrentTenant() tenant: any,
  ) {
    const query = new GetTenderChecklistsQuery(
      tenderId,
      tenant.tenantId,
    );

    return this.queryBus.execute(query);
  }

  @Post(':id/analyses/viability')
  @ApiOperation({ summary: 'Submete a análise de viabilidade para um edital' })
  @ApiResponse({ status: 201, description: 'Análise de viabilidade submetida com sucesso' })
  async submitViabilityAnalysis(
    @Param('id') tenderId: string,
    @Body() dto: SubmitTenderAnalysisDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new SubmitTenderAnalysisCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto,
    );

    const analysisId = await this.commandBus.execute(command);
    return { success: true, message: 'Análise de viabilidade submetida com sucesso.', analysisId };
  }

  @Post(':id/proposals')
  @ApiOperation({ summary: 'Submete a proposta comercial para um edital' })
  @ApiResponse({ status: 201, description: 'Proposta comercial submetida com sucesso' })
  async submitProposal(
    @Param('id') tenderId: string,
    @Body() dto: CreateTenderProposalDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new CreateTenderProposalCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto,
    );

    const proposalId = await this.commandBus.execute(command);
    return { success: true, message: 'Proposta comercial submetida com sucesso.', proposalId };
  }

  @Get(':id/proposals/pdf')
  @ApiOperation({ summary: 'Exporta a proposta comercial oficial em PDF' })
  @ApiResponse({ status: 200, description: 'Download do PDF da proposta' })
  async exportProposalPdf(
    @Param('id') tenderId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.tenderProposalPdfService.gerarPdfProposta(tenderId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Proposta_Comercial.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/proposals/submit-to-portal')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Envia automaticamente a proposta ao portal de compras' })
  @ApiResponse({ status: 202, description: 'Envio da proposta iniciado com sucesso' })
  async submitBidToPortal(
    @Param('id') tenderId: string,
    @CurrentTenant() tenant: any,
  ) {
    const command = new SubmitBidToPortalCommand(tenderId, tenant.tenantId);
    await this.commandBus.execute(command);
    
    return { success: true, message: 'Envio da proposta iniciado' };
  }

  @Post(':id/ai/ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faz uma pergunta ao chatbot especialista RAG sobre este edital' })
  @ApiResponse({ status: 200, description: 'Resposta da IA gerada com sucesso' })
  async askTenderAi(
    @Param('id') tenderId: string,
    @Body() dto: AskTenderAiDto,
    @CurrentTenant() tenant: any,
  ) {
    const query = new AskTenderAiQuery(tenderId, tenant.tenantId, dto.question);
    const result = await this.queryBus.execute(query);
    
    return result;
  }
}
