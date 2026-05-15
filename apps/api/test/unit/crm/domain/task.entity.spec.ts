import { randomUUID } from 'crypto';
import { TaskEntity } from '../../../../../src/crm/domain/task/task.entity';
import { TaskStatus } from '../../../../../src/crm/domain/common/enums/task-status.enum';
import { TaskPriority } from '../../../../../src/crm/domain/common/enums/task-priority.enum';

describe('TaskEntity — Domain', () => {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const adminId = randomUUID();

  const validProps = () => ({
    tenantId,
    title: 'Enviar proposta comercial',
    assignedTo: userId,
    assignedBy: adminId,
    priority: TaskPriority.HIGH,
  });

  describe('create()', () => {
    it('deve criar tarefa com status PENDING', () => {
      const task = TaskEntity.create(validProps());
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.title).toBe('Enviar proposta comercial');
    });

    it('deve rejeitar título vazio', () => {
      expect(() => TaskEntity.create({ ...validProps(), title: '' }))
        .toThrow('Title is required');
    });

    it('deve aceitar referências opcionais', () => {
      const task = TaskEntity.create({
        ...validProps(),
        leadId: randomUUID(),
        opportunityId: randomUUID(),
        dueDate: new Date(Date.now() + 86400000),
      });
      expect(task.leadId).toBeDefined();
      expect(task.dueDate).toBeDefined();
    });
  });

  describe('complete()', () => {
    it('deve marcar tarefa como COMPLETED', () => {
      const task = TaskEntity.create(validProps());
      task.complete(userId);
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.completedBy).toBe(userId);
      expect(task.completedAt).toBeDefined();
    });

    it('deve rejeitar completar tarefa já cancelada', () => {
      const task = TaskEntity.create(validProps());
      task.cancel('Mudou de ideia', adminId);
      expect(() => task.complete(userId)).toThrow('Cannot complete a cancelled task');
    });

    it('deve disparar TaskCompletedEvent', () => {
      const task = TaskEntity.create(validProps());
      task.complete(userId);
      expect(task.getDomainEvents().some(e => e.type === 'com.bidflow.crm.task.completed.v1')).toBe(true);
    });
  });

  describe('cancel()', () => {
    it('deve cancelar tarefa com motivo', () => {
      const task = TaskEntity.create(validProps());
      task.cancel('Prioridade alterada', adminId);
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    it('deve rejeitar cancelar tarefa já completa', () => {
      const task = TaskEntity.create(validProps());
      task.complete(userId);
      expect(() => task.cancel('Motivo', adminId)).toThrow('Cannot cancel a completed task');
    });
  });

  describe('startProgress()', () => {
    it('deve iniciar progresso', () => {
      const task = TaskEntity.create(validProps());
      task.startProgress();
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('isOverdue()', () => {
    it('deve retornar true se dueDate passou e status é PENDING', () => {
      const task = TaskEntity.create({ ...validProps(), dueDate: new Date(Date.now() - 86400000) });
      expect(task.isOverdue()).toBe(true);
    });

    it('deve retornar false se não tem dueDate', () => {
      const task = TaskEntity.create(validProps());
      expect(task.isOverdue()).toBe(false);
    });

    it('deve retornar false se já completa', () => {
      const task = TaskEntity.create({ ...validProps(), dueDate: new Date(Date.now() - 86400000) });
      task.complete(userId);
      expect(task.isOverdue()).toBe(false);
    });
  });
});
