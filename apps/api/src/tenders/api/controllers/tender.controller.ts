import { Controller, Post, Body } from '@nestjs/common';
import { CurrentTenant } from '../../../workflow/api/guards/current-tenant.decorator';
import { CaptureTenderDto } from '../../application/commands/capture-tender/capture-tender.dto';
import { CaptureTenderCommand } from '../../application/commands/capture-tender/capture-tender.command';
import { CaptureTenderHandler } from '../../application/commands/capture-tender/capture-tender.handler';

@Controller('v1/tenders')
export class TenderController {
  constructor(private readonly captureTenderHandler: CaptureTenderHandler) {}

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
}
