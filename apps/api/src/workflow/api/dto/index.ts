import { IsString, IsOptional, IsUUID, IsInt, Min, Max, IsBoolean, IsArray, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ example: 'Fluxo de Aprovação de RFP' })
  @IsString() readonly name: string;

  @ApiProperty({ example: 'aprovacao-rfp' })
  @IsString() readonly slug: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() readonly description?: string;

  @ApiProperty({ example: 'bidding.rfp' })
  @IsString() readonly entityType: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() readonly icon?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() readonly color?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1) readonly maxConcurrentInstances?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsObject() readonly metadata?: Record<string, unknown>;
}

export class UpdateWorkflowDefinitionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() readonly name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly color?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) readonly maxConcurrentInstances?: number;
}

export class CreateStageDto {
  @ApiProperty() @IsString() readonly slug: string;
  @ApiProperty() @IsString() readonly name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly description?: string;
  @ApiProperty() @IsInt() @Min(1) readonly order: number;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly color?: string;
  @ApiProperty({ enum: ['INITIAL', 'STANDARD', 'APPROVAL', 'REVIEW', 'FINISH', 'CANCELLED'] })
  @IsEnum(['INITIAL', 'STANDARD', 'APPROVAL', 'REVIEW', 'FINISH', 'CANCELLED']) readonly type: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly isInitial?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly isFinal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly approvalConfig?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly assignmentConfig?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) readonly deadlineHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly notifyOnEnter?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly notifyOnExit?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly allowRejection?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() readonly rejectionTargetStageId?: string;
}

export class UpdateStageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() readonly name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) readonly order?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly color?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) readonly deadlineHours?: number;
}

export class CreateTransitionDto {
  @ApiProperty() @IsString() readonly slug: string;
  @ApiProperty() @IsString() readonly name: string;
  @ApiProperty() @IsUUID() readonly fromStageId: string;
  @ApiProperty() @IsUUID() readonly toStageId: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly conditions?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly permissions?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readonly isAutomatic?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly autoTriggerEvent?: string;
}

export class CreateWorkflowInstanceDto {
  @ApiProperty() @IsUUID() readonly workflowDefinitionId: string;
  @ApiProperty({ example: 'bidding.rfp' }) @IsString() readonly entityType: string;
  @ApiProperty() @IsUUID() readonly entityId: string;
  @ApiProperty() @IsString() readonly title: string;
  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional() @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT']) readonly priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly data?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsUUID() readonly assignedTo?: string;
}

export class ExecuteTransitionDto {
  @ApiProperty() @IsString() readonly transitionSlug: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly comment?: string;
}

export class CancelInstanceDto {
  @ApiProperty() @IsString() readonly reason: string;
}

export class ReassignDto {
  @ApiProperty() @IsUUID() readonly assignedTo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly roleSlug?: string;
}

export class ApprovalDecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() readonly comment?: string;
}

export class DelegateApprovalDto {
  @ApiProperty() @IsUUID() readonly delegatedTo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() readonly reason?: string;
}

export class CompleteWorkflowTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsObject() readonly completedData?: Record<string, unknown>;
}
