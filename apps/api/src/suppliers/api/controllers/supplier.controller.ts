import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { RegisterSupplierHandler } from '../../application/commands/register-supplier/register-supplier.handler';
import { RegisterSupplierDto } from '../../application/commands/register-supplier/register-supplier.dto';
import { RegisterSupplierCommand } from '../../application/commands/register-supplier/register-supplier.command';
import { UpdateSupplierComplianceHandler } from '../../application/commands/update-compliance/update-compliance.handler';
import { UpdateSupplierComplianceDto } from '../../application/commands/update-compliance/update-compliance.dto';
import { UpdateSupplierComplianceCommand } from '../../application/commands/update-compliance/update-compliance.command';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly registerSupplierHandler: RegisterSupplierHandler,
    private readonly updateComplianceHandler: UpdateSupplierComplianceHandler
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier registered successfully' })
  @ApiResponse({ status: 400, description: 'Supplier already registered under this CNPJ or invalid input' })
  async registerSupplier(
    @CurrentTenant() tenant: { tenantId: string; userId: string },
    @Body() dto: RegisterSupplierDto
  ) {
    const command = new RegisterSupplierCommand(
      tenant.tenantId,
      tenant.userId,
      dto.corporateName,
      dto.tradeName,
      dto.cnpj,
      dto.metadata
    );

    const id = await this.registerSupplierHandler.execute(command);
    return { id, message: 'Supplier registered successfully' };
  }

  @Patch(':id/compliance')
  @ApiOperation({ summary: 'Update supplier compliance score' })
  @ApiResponse({ status: 200, description: 'Compliance score updated successfully' })
  @ApiResponse({ status: 400, description: 'Supplier not found or invalid score' })
  async updateCompliance(
    @Param('id') id: string,
    @CurrentTenant() tenant: { tenantId: string; userId: string },
    @Body() dto: UpdateSupplierComplianceDto
  ) {
    const command = new UpdateSupplierComplianceCommand(
      id,
      tenant.tenantId,
      tenant.userId,
      dto.newScore
    );

    await this.updateComplianceHandler.execute(command);
    return { message: 'Compliance score updated successfully' };
  }
}
