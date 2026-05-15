import { WorkflowStartedEvent, StageChangedEvent, ApprovalRequestedEvent, ApprovalGrantedEvent, WorkflowCompletedEvent, TaskAssignedEvent } from '../../../../src/workflow/events/domain-events';
import { randomUUID } from 'crypto';

describe('Workflow Domain Events — Unit', () => {
  const tenantId = randomUUID();
  const aggregateId = randomUUID();

  it('WorkflowStartedEvent deve ter type correto', () => {
    const e = new WorkflowStartedEvent(aggregateId, tenantId, randomUUID(), 'aprovacao', 1, 'bidding.rfp', randomUUID(), 'RFP #001', 'inicio', randomUUID(), 'HIGH', {}, randomUUID());
    expect(e.type).toBe('com.bidflow.workflow.instance.started.v1');
    expect(e.tenantId).toBe(tenantId);
    expect(e.eventId).toBeDefined();
  });

  it('StageChangedEvent deve ter from → to', () => {
    const e = new StageChangedEvent(aggregateId, tenantId, randomUUID(), aggregateId, 'rascunho', 'Rascunho', 'revisao', 'Revisão', 'enviar_revisao', 'Enviar', false, 'Comentário', randomUUID(), null, false);
    expect(e.fromStage).toBe('rascunho');
    expect(e.toStage).toBe('revisao');
  });

  it('ApprovalRequestedEvent deve ter assignedTo', () => {
    const e = new ApprovalRequestedEvent(aggregateId, tenantId, randomUUID(), aggregateId, randomUUID(), randomUUID(), 'Aprovação', 'ANY', randomUUID(), 'approver', 1, null, 'RFP', 'bidding.rfp', randomUUID());
    expect(e.assignedRole).toBe('approver');
    expect(e.approvalMode).toBe('ANY');
  });

  it('ApprovalGrantedEvent deve registrar decisão', () => {
    const e = new ApprovalGrantedEvent(aggregateId, tenantId, randomUUID(), aggregateId, randomUUID(), randomUUID(), 'APPROVED', randomUUID(), 'Aprovado', 'ANY', 0, null);
    expect(e.decision).toBe('APPROVED');
    expect(e.remainingApprovals).toBe(0);
  });

  it('WorkflowCompletedEvent deve registrar resultado final', () => {
    const e = new WorkflowCompletedEvent(aggregateId, tenantId, randomUUID(), 'aprovacao', 1, 'bidding.rfp', randomUUID(), 'RFP', 'aprovado', 4, 21600000, randomUUID(), 'COMPLETED', null);
    expect(e.result).toBe('COMPLETED');
    expect(e.totalTransitions).toBe(4);
  });

  it('TaskAssignedEvent deve registrar atribuição', () => {
    const e = new TaskAssignedEvent(aggregateId, tenantId, randomUUID(), aggregateId, randomUUID(), randomUUID(), 'Revisão', 'Anexar doc', null, 'UPLOAD', randomUUID(), randomUUID(), true, null, 'RFP', 'bidding.rfp', randomUUID());
    expect(e.taskType).toBe('UPLOAD');
    expect(e.isMandatory).toBe(true);
  });
});
