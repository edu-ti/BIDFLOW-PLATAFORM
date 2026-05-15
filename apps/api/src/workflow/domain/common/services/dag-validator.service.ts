import { WorkflowDefinitionEntity } from '../definition/workflow-definition.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class DagValidatorService {
  validate(definition: WorkflowDefinitionEntity): ValidationResult {
    const errors: string[] = [];

    const initialStages = definition.stages.filter(s => s.isInitial);
    if (initialStages.length !== 1) {
      errors.push('Workflow must have exactly one initial stage');
    }

    const finalStages = definition.stages.filter(s => s.isFinal);
    if (finalStages.length < 1) {
      errors.push('Workflow must have at least one final stage');
    }

    const orders = definition.stages.map(s => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        errors.push(`Stage orders must be sequential: missing order ${i + 1}`);
        break;
      }
    }

    const slugs = new Set<string>();
    for (const stage of definition.stages) {
      if (slugs.has(stage.slug)) errors.push(`Duplicate stage slug: ${stage.slug}`);
      slugs.add(stage.slug);
    }

    for (const t of definition.transitions) {
      if (!definition.stages.some(s => s.id === t.fromStageId)) {
        errors.push(`Transition ${t.slug}: fromStage ${t.fromStageId} not found`);
      }
      if (!definition.stages.some(s => s.id === t.toStageId)) {
        errors.push(`Transition ${t.slug}: toStage ${t.toStageId} not found`);
      }
      if (t.fromStageId === t.toStageId) {
        errors.push(`Transition ${t.slug}: cannot be self-referential`);
      }
    }

    const nonFinalStages = definition.stages.filter(s => !s.isFinal);
    for (const stage of nonFinalStages) {
      const hasOutgoing = definition.transitions.some(t => t.fromStageId === stage.id);
      if (!hasOutgoing) {
        errors.push(`Stage '${stage.slug}' has no outgoing transitions`);
      }
    }

    if (this.hasCycle(definition)) {
      errors.push('Workflow contains a cycle');
    }

    return { valid: errors.length === 0, errors };
  }

  private hasCycle(definition: WorkflowDefinitionEntity): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (stageId: string, transitions: typeof definition.transitions): boolean => {
      visited.add(stageId);
      recStack.add(stageId);

      const outgoing = transitions.filter(t => t.fromStageId === stageId);
      for (const t of outgoing) {
        if (!visited.has(t.toStageId)) {
          if (dfs(t.toStageId, transitions)) return true;
        } else if (recStack.has(t.toStageId)) {
          return true;
        }
      }

      recStack.delete(stageId);
      return false;
    };

    for (const stage of definition.stages) {
      if (!visited.has(stage.id)) {
        if (dfs(stage.id, definition.transitions)) return true;
      }
    }
    return false;
  }
}
