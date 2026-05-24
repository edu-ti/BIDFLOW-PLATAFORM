import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
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
  @ApiResponse({ status: 400, description: 'Tender not found or document already validated' })
  async uploadDocument(
    @Param('id') tenderId: string,
    @Body() dto: UploadTenderDocumentDto,
    @CurrentTenant() tenant: any,
  ) {
    const command = new UploadTenderDocumentCommand(
      tenderId,
      tenant.tenantId,
      tenant.userId || 'system',
      dto.type,
      dto.title,
      dto.fileUrl,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    );

    const documentId = await this.uploadTenderDocumentHandler.execute(command);
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
}
