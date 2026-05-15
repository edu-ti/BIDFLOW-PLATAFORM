import { randomUUID } from 'crypto';
import { StageType, InstancePriority, InstanceStatus, ApprovalMode, TaskType } from '../../../../src/workflow/domain/common/enums';

export const tenantAId = randomUUID();
export const tenantBId = randomUUID();
export const userId = randomUUID();
export const adminId = randomUUID();

export const makeDefinitionProps = (overrides = {}) => ({
  tenantId: tenantAId,
  name: 'Fluxo de Aprovação',
  slug: 'aprovacao',
  entityType: 'bidding.rfp',
  createdBy: adminId,
  ...overrides,
});

export const makeStageProps = (definitionId: string, overrides = {}) => ({
  workflowDefinitionId: definitionId,
  slug: 'rascunho',
  name: 'Rascunho',
  order: 1,
  type: StageType.INITIAL,
  isInitial: true,
  isFinal: false,
  ...overrides,
});

export const makeTransitionProps = (definitionId: string, fromId: string, toId: string, overrides = {}) => ({
  workflowDefinitionId: definitionId,
  slug: 'avancar',
  name: 'Avançar',
  fromStageId: fromId,
  toStageId: toId,
  ...overrides,
});

export const makeInstanceProps = (definitionId: string, stageId: string, overrides = {}) => ({
  tenantId: tenantAId,
  workflowDefinitionId: definitionId,
  workflowVersion: 1,
  entityType: 'bidding.rfp',
  entityId: randomUUID(),
  title: 'Aprovação RFP #001',
  currentStageId: stageId,
  createdBy: userId,
  ...overrides,
});

export const makeApprovalProps = (instanceId: string, stageId: string, overrides = {}) => ({
  tenantId: tenantAId,
  workflowInstanceId: instanceId,
  stageId,
  approvalMode: ApprovalMode.ANY,
  assignedTo: userId,
  allowSelfApproval: true,
  canDelegate: true,
  instanceCreatedBy: adminId,
  ...overrides,
});
