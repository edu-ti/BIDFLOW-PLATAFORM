export interface WorkflowDefinitionResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  entityType: string;
  version: number;
  isPublished: boolean;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDefinitionDetailDto extends WorkflowDefinitionResponseDto {
  stages: StageResponseDto[];
  transitions: TransitionResponseDto[];
}

export interface StageResponseDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  color: string | null;
  type: string;
  isInitial: boolean;
  isFinal: boolean;
  deadlineHours: number | null;
  approvalConfig: Record<string, unknown> | null;
  assignmentConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransitionResponseDto {
  id: string;
  slug: string;
  name: string;
  fromStageId: string;
  toStageId: string;
  conditions: Record<string, unknown> | null;
  isAutomatic: boolean;
  autoTriggerEvent: string | null;
}

export interface WorkflowInstanceResponseDto {
  id: string;
  workflowDefinitionId: string;
  workflowSlug: string;
  entityType: string;
  entityId: string;
  title: string;
  status: string;
  currentStage: string;
  enteredStageAt: string;
  deadlineAt: string | null;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstanceDetailDto extends WorkflowInstanceResponseDto {
  workflowVersion: number;
  assignedRole: string | null;
  data: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  completedBy: string | null;
  approvals: ApprovalResponseDto[];
  tasks: TaskResponseDto[];
  transitionCount: number;
}

export interface ApprovalResponseDto {
  id: string;
  status: string;
  approvalMode: string;
  assignedTo: string;
  assignedRole: string | null;
  order: number;
  decidedAt: string | null;
  decision: string | null;
  comment: string | null;
  delegatedTo: string | null;
  deadlineAt: string | null;
  createdAt: string;
}

export interface TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  assignedTo: string | null;
  isMandatory: boolean;
  dueDate: string | null;
  createdAt: string;
}

export interface TimelineEntryDto {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
  createdBy: string | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowSummaryDto {
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;
  pendingApprovals: number;
  pendingTasks: number;
  byWorkflow: Array<{
    slug: string;
    name: string;
    active: number;
    completed: number;
  }>;
}

export interface PendingItemsDto {
  approvals: ApprovalResponseDto[];
  tasks: TaskResponseDto[];
  overdueInstances: WorkflowInstanceResponseDto[];
}
