import { randomUUID } from 'crypto';
import { WorkflowDefinitionEntity } from '../../../src/workflow/domain/definition/workflow-definition.entity';
import { StageEntity } from '../../../src/workflow/domain/stage/stage.entity';
import { TransitionEntity } from '../../../src/workflow/domain/transition/transition.entity';
import { StageType } from '../../../src/workflow/domain/common/enums';
import { makeDefinitionProps } from '../../fixtures/workflow.fixtures';

describe('Workflow — Regras de Negócio', () => {
  describe('Transições inválidas', () => {
    it('não deve permitir transição de estágio que não é o atual', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'a', name: 'A', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
      const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'b', name: 'B', order: 2, type: StageType.STANDARD, isInitial: false, isFinal: false });
      const s3 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'c', name: 'C', order: 3, type: StageType.FINISH, isInitial: false, isFinal: true });
      def.addStage(s1); def.addStage(s2); def.addStage(s3);
      def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'ab', name: 'AB', fromStageId: s1.id, toStageId: s2.id }));
      def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'bc', name: 'BC', fromStageId: s2.id, toStageId: s3.id }));
      def.publish();

      const transitionFromS1 = def.getTransition('ab', s1.id);
      expect(transitionFromS1).toBeDefined();

      const transitionFromS2 = def.getTransition('ab', s2.id);
      expect(transitionFromS2).toBeUndefined();
    });

    it('transição automática exige evento', () => {
      expect(() => TransitionEntity.create({ workflowDefinitionId: randomUUID(), slug: 'auto', name: 'Auto', fromStageId: randomUUID(), toStageId: randomUUID(), isAutomatic: true }))
        .toThrow('Auto-trigger event is required');
    });
  });

  describe('Permissões', () => {
    it('WORKFLOW_CYCLE_DETECTED para grafos com ciclo', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'a', name: 'A', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
      const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'b', name: 'B', order: 2, type: StageType.FINISH, isInitial: false, isFinal: true });
      def.addStage(s1); def.addStage(s2);
      def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'ab', name: 'AB', fromStageId: s1.id, toStageId: s2.id }));
      def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'ba', name: 'BA', fromStageId: s2.id, toStageId: s1.id }));
      expect(() => def.publish()).toThrow('Workflow definition contains a cycle');
    });

    it('PUBLISHED_IMMUTABLE: não alterar após publicação', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'a', name: 'A', order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
      const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: 'b', name: 'B', order: 2, type: StageType.FINISH, isInitial: false, isFinal: true });
      def.addStage(s1); def.addStage(s2);
      def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: 'ab', name: 'AB', fromStageId: s1.id, toStageId: s2.id }));
      def.publish();
      expect(() => def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: 'c', name: 'C', order: 3, type: StageType.STANDARD, isInitial: false, isFinal: false })))
        .toThrow('Published workflow definition cannot be modified');
    });
  });

  describe('Approval ANY resolve', () => {
    it('primeiro APPROVED resolve todas', () => {
      const { ApprovalEntity } = require('../../../src/workflow/domain/approval/approval.entity');
      const { ApprovalEngine } = require('../../../src/workflow/domain/common/services/approval-engine.service');
      const engine = new ApprovalEngine();
      const tenantId = randomUUID(), instanceId = randomUUID(), stageId = randomUUID();

      const a1 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ANY', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
      const a2 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ANY', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
      a1.approve();
      const result = engine.processDecision(a1, [a1, a2]);
      expect(result.allResolved).toBe(true);
    });
  });

  describe('Approval ALL exige todos', () => {
    it('não resolve até última approval', () => {
      const { ApprovalEntity } = require('../../../src/workflow/domain/approval/approval.entity');
      const { ApprovalEngine } = require('../../../src/workflow/domain/common/services/approval-engine.service');
      const engine = new ApprovalEngine();
      const tenantId = randomUUID(), instanceId = randomUUID(), stageId = randomUUID();

      const a1 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ALL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
      const a2 = ApprovalEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, approvalMode: 'ALL', assignedTo: randomUUID(), allowSelfApproval: true, canDelegate: true, instanceCreatedBy: randomUUID() });
      a1.approve();
      expect(engine.processDecision(a1, [a1, a2]).allResolved).toBe(false);
      a2.approve();
      expect(engine.processDecision(a2, [a1, a2]).allResolved).toBe(true);
    });
  });
});
