import { randomUUID } from 'crypto';
import { WorkflowTaskEntity } from '../../../../src/workflow/domain/task/workflow-task.entity';
import { TaskType, TaskStatus } from '../../../../src/workflow/domain/common/enums';

describe('WorkflowTaskEntity — Domain', () => {
  const tenantId = randomUUID();
  const instanceId = randomUUID();
  const stageId = randomUUID();
  const userId = randomUUID();

  it('deve criar tarefa PENDING', () => {
    const t = WorkflowTaskEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, title: 'Anexar documento', type: TaskType.UPLOAD, assignedTo: userId });
    expect(t.status).toBe(TaskStatus.PENDING);
    expect(t.isMandatory).toBe(true);
  });

  it('deve completar tarefa', () => {
    const t = WorkflowTaskEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, title: 'Validar', type: TaskType.VALIDATION });
    t.complete(userId, { validated: true });
    expect(t.status).toBe(TaskStatus.COMPLETED);
    expect(t.getDomainEvents().some(e => e.type === 'com.bidflow.workflow.task.completed.v1')).toBe(true);
  });

  it('deve rejeitar completar tarefa cancelada', () => {
    const t = WorkflowTaskEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, title: 'Teste', type: TaskType.ACTION });
    t.cancel();
    expect(() => t.complete(userId)).toThrow('Cannot complete a cancelled task');
  });

  it('deve iniciar progresso', () => {
    const t = WorkflowTaskEntity.create({ tenantId, workflowInstanceId: instanceId, stageId, title: 'Progresso', type: TaskType.ACTION });
    t.startProgress();
    expect(t.status).toBe(TaskStatus.IN_PROGRESS);
  });
});

describe('TransitionLogEntity — Domain', () => {
  it('deve criar log imutável', () => {
    const { TransitionLogEntity } = require('../../../../src/workflow/domain/transition-log/transition-log.entity');
    const log = TransitionLogEntity.create({ tenantId: randomUUID(), workflowInstanceId: randomUUID(), transitionSlug: 'avancar', fromStageId: randomUUID(), fromStageName: 'Início', toStageId: randomUUID(), toStageName: 'Fim', executedBy: randomUUID() });
    expect(log.transitionSlug).toBe('avancar');
    expect(log.executedAt).toBeDefined();
  });
});
