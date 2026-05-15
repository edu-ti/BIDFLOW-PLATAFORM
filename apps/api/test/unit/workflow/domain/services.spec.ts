import { DagValidatorService } from '../../../../src/workflow/domain/common/services/dag-validator.service';
import { WorkflowDefinitionEntity } from '../../../../src/workflow/domain/definition/workflow-definition.entity';
import { StageEntity } from '../../../../src/workflow/domain/stage/stage.entity';
import { TransitionEntity } from '../../../../src/workflow/domain/transition/transition.entity';
import { StageType } from '../../../../src/workflow/domain/common/enums';
import { randomUUID } from 'crypto';

describe('DagValidatorService — Domain Service', () => {
  const validator = new DagValidatorService();

  it('deve validar DAG válido', () => {
    const def = buildDefinition();
    const result = validator.validate(def);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('deve detectar falta de estágio inicial', () => {
    const def = WorkflowDefinitionEntity.create({ tenantId: randomUUID(), name: 'Test', slug: 'test', entityType: 'x', createdBy: randomUUID() });
    const s = StageEntity.create({ workflowDefinitionId: def.id, slug: 's1', name: 'S1', order: 1, type: StageType.STANDARD, isInitial: false, isFinal: false });
    def.addStage(s);
    const result = validator.validate(def);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('initial stage'))).toBe(true);
  });

  it('deve detectar falta de estágio final', () => {
    const def = WorkflowDefinitionEntity.create({ tenantId: randomUUID(), name: 'Test', slug: 'test', entityType: 'x', createdBy: randomUUID() });
    def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: 's1', name: 'S1', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false }));
    const result = validator.validate(def);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('final stage'))).toBe(true);
  });

  it('deve detectar slug duplicado', () => {
    const def = WorkflowDefinitionEntity.create({ tenantId: randomUUID(), name: 'Test', slug: 'test', entityType: 'x', createdBy: randomUUID() });
    def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: 'dup', name: 'A', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false }));
    def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: 'dup', name: 'B', order: 2, type: StageType.FINISH, isInitial: false, isFinal: true }));
    const result = validator.validate(def);
    expect(result.valid).toBe(false);
  });

  it('deve detectar estágio sem transição de saída', () => {
    const def = WorkflowDefinitionEntity.create({ tenantId: randomUUID(), name: 'Test', slug: 'test', entityType: 'x', createdBy: randomUUID() });
    const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'inicio', name: 'Início', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
    const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'fim', name: 'Fim', order: 2, type: StageType.FINISH, isInitial: false, isFinal: true });
    def.addStage(s1); def.addStage(s2);
    def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 't1', name: 'T1', fromStageId: s1.id, toStageId: s2.id }));
    const result = validator.validate(def);
    expect(result.valid).toBe(true);
  });

  function buildDefinition(): WorkflowDefinitionEntity {
    const def = WorkflowDefinitionEntity.create({ tenantId: randomUUID(), name: 'Test', slug: 'test', entityType: 'x', createdBy: randomUUID() });
    const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'a', name: 'A', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
    const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'b', name: 'B', order: 2, type: StageType.STANDARD, isInitial: false, isFinal: false });
    const s3 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'c', name: 'C', order: 3, type: StageType.FINISH, isInitial: false, isFinal: true });
    def.addStage(s1); def.addStage(s2); def.addStage(s3);
    def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'ab', name: 'AB', fromStageId: s1.id, toStageId: s2.id }));
    def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'bc', name: 'BC', fromStageId: s2.id, toStageId: s3.id }));
    return def;
  }
});

describe('ApprovalEngine — Domain Service', () => {
  const { ApprovalEngine } = require('../../../../src/workflow/domain/common/services/approval-engine.service');
  const { ApprovalEntity } = require('../../../../src/workflow/domain/approval/approval.entity');
  const engine = new ApprovalEngine();
  const tenantId = randomUUID(), instanceId = randomUUID(), stageId = randomUUID();

  it('modo ANY: primeira approval resolve', () => {
    const a1 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ANY', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
    const a2 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ANY', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
    a1.approve();
    const result = engine.processDecision(a1, [a1, a2]);
    expect(result.allResolved).toBe(true);
  });

  it('modo ALL: todas devem aprovar', () => {
    const a1 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ALL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
    const a2 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ALL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
    a1.approve();
    let result = engine.processDecision(a1, [a1, a2]);
    expect(result.allResolved).toBe(false);
    a2.approve();
    result = engine.processDecision(a2, [a1, a2]);
    expect(result.allResolved).toBe(true);
  });

  it('modo SEQUENTIAL: ordem respeitada', () => {
    const a1 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'SEQUENTIAL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID(), order: 1 });
    const a2 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'SEQUENTIAL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID(), order: 2 });
    a1.approve();
    const result = engine.processDecision(a1, [a1, a2]);
    expect(result.nextInSequence).toBeDefined();
    expect(result.nextInSequence!.order).toBe(2);
  });

  it('canTransition() retorna bloqueado se pending', () => {
    const a = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ANY', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
    const result = engine.canTransition([a], stageId);
    expect(result.allowed).toBe(false);
  });
});
