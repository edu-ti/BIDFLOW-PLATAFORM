import { randomUUID } from 'crypto';
import { StageEntity, CreateStageProps } from '../../../../src/workflow/domain/stage/stage.entity';
import { TransitionEntity } from '../../../../src/workflow/domain/transition/transition.entity';
import { StageType, ApprovalMode } from '../../../../src/workflow/domain/common/enums';
import { ApprovalConfig } from '../../../../src/workflow/domain/common/value-objects/approval-config';
import { AssignmentConfig } from '../../../../src/workflow/domain/common/value-objects/assignment-config';

describe('StageEntity — Domain', () => {
  const defId = randomUUID();

  it('deve criar estágio INITIAL', () => {
    const s = StageEntity.create({ workflowDefinitionId: defId, slug: 'inicio', name: 'Início', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
    expect(s.isInitial).toBe(true);
    expect(s.order).toBe(1);
  });

  it('deve rejeitar order < 1', () => {
    expect(() => StageEntity.create({ workflowDefinitionId: defId, slug: 'x', name: 'X', order: 0, type: StageType.STANDARD, isInitial: false, isFinal: false }))
      .toThrow('Stage order must be >= 1');
  });

  it('deve rejeitar APPROVAL sem approvalConfig', () => {
    expect(() => StageEntity.create({ workflowDefinitionId: defId, slug: 'aprov', name: 'Aprov', order: 1, type: StageType.APPROVAL, isInitial: false, isFinal: false }))
      .toThrow('Approval stages require approvalConfig');
  });

  it('deve criar APPROVAL com config', () => {
    const s = StageEntity.create({
      workflowDefinitionId: defId, slug: 'aprov', name: 'Aprovação', order: 1,
      type: StageType.APPROVAL, isInitial: false, isFinal: false,
      approvalConfig: { mode: ApprovalMode.ANY, requiredApprovals: 1, allowSelfApproval: false, canDelegate: true },
    });
    expect(s.isApprovalStage()).toBe(true);
    expect(s.approvalConfig).toBeInstanceOf(ApprovalConfig);
  });

  it('isApprovalStage() retorna true apenas para APPROVAL', () => {
    const approval = StageEntity.create({ workflowDefinitionId: defId, slug: 'a', name: 'A', order: 1, type: StageType.APPROVAL, isInitial: false, isFinal: false, approvalConfig: { mode: ApprovalMode.ANY, requiredApprovals: 1, allowSelfApproval: true, canDelegate: true } });
    const standard = StageEntity.create({ workflowDefinitionId: defId, slug: 's', name: 'S', order: 1, type: StageType.STANDARD, isInitial: false, isFinal: false });
    expect(approval.isApprovalStage()).toBe(true);
    expect(standard.isApprovalStage()).toBe(false);
  });
});

describe('TransitionEntity — Domain', () => {
  const defId = randomUUID();
  const fromId = randomUUID();
  const toId = randomUUID();

  it('deve criar transição', () => {
    const t = TransitionEntity.create({ workflowDefinitionId: defId, slug: 'avancar', name: 'Avançar', fromStageId: fromId, toStageId: toId });
    expect(t.slug).toBe('avancar');
    expect(t.isAutomatic).toBe(false);
  });

  it('deve rejeitar auto sem autoTriggerEvent', () => {
    expect(() => TransitionEntity.create({ workflowDefinitionId: defId, slug: 'auto', name: 'Auto', fromStageId: fromId, toStageId: toId, isAutomatic: true }))
      .toThrow('Auto-trigger event is required');
  });

  it('deve aceitar auto com autoTriggerEvent', () => {
    const t = TransitionEntity.create({ workflowDefinitionId: defId, slug: 'auto', name: 'Auto', fromStageId: fromId, toStageId: toId, isAutomatic: true, autoTriggerEvent: 'com.bidflow.bidding.proposal.submitted.v1' });
    expect(t.isAutomatic).toBe(true);
  });
});
