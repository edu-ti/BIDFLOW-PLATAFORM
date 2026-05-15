import { randomUUID } from 'crypto';
import { WorkflowInstanceEntity } from '../../../../src/workflow/domain/instance/workflow-instance.entity';
import { InstanceStatus, InstancePriority } from '../../../../src/workflow/domain/common/enums';
import { DuplicateWorkflowInstanceError, InstanceAlreadyCompletedError, MaxConcurrentInstancesError } from '../../../../src/workflow/domain/common/errors';
import { makeInstanceProps } from '../../../fixtures/workflow.fixtures';

describe('WorkflowInstanceEntity — Domain', () => {
  const defId = randomUUID();
  const stageId = randomUUID();

  describe('create()', () => {
    it('deve criar instância ACTIVE', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      expect(inst.status).toBe(InstanceStatus.ACTIVE);
      expect(inst.currentStageId).toBe(stageId);
    });

    it('deve rejeitar título vazio', () => {
      expect(() => WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId, { title: '' })))
        .toThrow('Title is required');
    });

    it('deve rejeitar se maxConcurrentInstances excedido', () => {
      expect(() => WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId, { maxConcurrentInstances: 2, existingActiveCount: 2 })))
        .toThrow(MaxConcurrentInstancesError);
    });
  });

  describe('moveToStage()', () => {
    it('deve mover para novo estágio e calcular deadline', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      const newStageId = randomUUID();
      const deadline = new Date(Date.now() + 3600000);
      inst.moveToStage(newStageId, deadline);
      expect(inst.currentStageId).toBe(newStageId);
      expect(inst.deadlineAt).toEqual(deadline);
    });

    it('deve rejeitar mover instância completa', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.complete(userId);
      expect(() => inst.moveToStage(randomUUID())).toThrow(InstanceAlreadyCompletedError);
    });
  });

  describe('complete() / cancel()', () => {
    it('deve completar e marcar datas', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.complete(userId);
      expect(inst.status).toBe(InstanceStatus.COMPLETED);
      expect(inst.completedBy).toBe(userId);
      expect(inst.completedAt).toBeDefined();
    });

    it('deve cancelar e disparar evento', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.cancel('Motivo', userId);
      expect(inst.status).toBe(InstanceStatus.CANCELLED);
      expect(inst.getDomainEvents().some(e => e.type === 'com.bidflow.workflow.instance.cancelled.v1')).toBe(true);
    });

    it('deve rejeitar completar já completo', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.complete(userId);
      expect(() => inst.complete(userId)).toThrow(InstanceAlreadyCompletedError);
    });
  });

  describe('reassign() / setPriority()', () => {
    it('deve reatribuir responsável', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.reassign(randomUUID());
      expect(inst.assignedTo).toBeDefined();
    });
    it('deve alterar prioridade', () => {
      const inst = WorkflowInstanceEntity.create(makeInstanceProps(defId, stageId));
      inst.setPriority(InstancePriority.URGENT);
      expect(inst.priority).toBe(InstancePriority.URGENT);
    });
  });
});

const userId = randomUUID();
