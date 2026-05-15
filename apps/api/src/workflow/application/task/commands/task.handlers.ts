import { WorkflowTaskRepository } from '../../../../domain/task/workflow-task.repository';
import { WorkflowTaskEntity } from '../../../../domain/task/workflow-task.entity';
import { CompleteTaskCommand } from '../../../common/commands';
import { ListTasksQuery, ListMyPendingTasksQuery } from '../../../common/queries';
import { TaskResponseDto } from '../../../common/dto';

export class CompleteTaskHandler {
  constructor(private readonly taskRepo: WorkflowTaskRepository) {}

  async execute(command: CompleteTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(command.taskId);
    if (!task) throw new Error('Task not found');
    if (task.tenantId !== command.tenantId) throw new Error('Tenant mismatch');

    task.complete(command.userId, command.completedData);
    await this.taskRepo.save(task);
  }
}

export class ListTasksHandler {
  constructor(private readonly taskRepo: WorkflowTaskRepository) {}

  async execute(query: ListTasksQuery): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepo.findByInstance(query.instanceId);
    return tasks.map(taskToDto);
  }
}

export class ListMyPendingTasksHandler {
  constructor(private readonly taskRepo: WorkflowTaskRepository) {}

  async execute(query: ListMyPendingTasksQuery): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepo.findPendingByUser(query.userId, query.tenantId);
    return tasks.map(taskToDto);
  }
}

function taskToDto(t: WorkflowTaskEntity): TaskResponseDto {
  return {
    id: t.id, title: t.title, description: t.description,
    type: t.type, status: t.status, assignedTo: t.assignedTo,
    isMandatory: t.isMandatory, dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}
