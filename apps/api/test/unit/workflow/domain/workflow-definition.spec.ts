import { randomUUID } from 'crypto';
import { WorkflowDefinitionEntity } from '../../../../src/workflow/domain/definition/workflow-definition.entity';
import { StageEntity } from '../../../../src/workflow/domain/stage/stage.entity';
import { TransitionEntity } from '../../../../src/workflow/domain/transition/transition.entity';
import { StageType } from '../../../../src/workflow/domain/common/enums';
import { WorkflowCycleDetectedError, NoInitialStageError, NoFinalStageError, PublishedWorkflowImmutableError } from '../../../../src/workflow/domain/common/errors';
import { makeDefinitionProps } from '../../../fixtures/workflow.fixtures';

describe('WorkflowDefinitionEntity — Domain', () => {
  describe('create()', () => {
    it('deve criar definição com versão 1 e isPublished false', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      expect(def.version).toBe(1);
      expect(def.isPublished).toBe(false);
      expect(def.isActive).toBe(true);
    });

    it('deve rejeitar name vazio', () => {
      expect(() => WorkflowDefinitionEntity.create(makeDefinitionProps({ name: '' })))
        .toThrow('Name is required');
    });

    it('deve rejeitar slug vazio', () => {
      expect(() => WorkflowDefinitionEntity.create(makeDefinitionProps({ slug: '' })))
        .toThrow('Slug is required');
    });
  });

  describe('publish()', () => {
    it('deve publicar definição válida', () => {
      const def = buildValidDefinition();
      def.publish();
      expect(def.isPublished).toBe(true);
      expect(def.publishedAt).toBeDefined();
    });

    it('deve rejeitar publish sem estágio inicial', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: "s1", name: "S1", order: 1, type: StageType.STANDARD, isInitial: false, isFinal: true }));
      def.addTransition(makeTransitionEntity(def, "s1", "s1"));
      expect(() => def.publish()).toThrow(NoInitialStageError);
    });

    it('deve rejeitar publish sem estágio final', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: "s1", name: "S1", order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false }));
      expect(() => def.publish()).toThrow(NoFinalStageError);
    });

    it('deve rejeitar publish com ciclo (DAG)', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: "a", name: "A", order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
      const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: "b", name: "B", order: 2, type: StageType.STANDARD, isInitial: false, isFinal: false });
      const s3 = StageEntity.create({ workflowDefinitionId: def.id, slug: "c", name: "C", order: 3, type: StageType.FINISH, isInitial: false, isFinal: true });
      def.addStage(s1); def.addStage(s2); def.addStage(s3);
      def.addTransition(makeTransitionEntity(def, s1.id, s2.id));
      def.addTransition(makeTransitionEntity(def, s2.id, s3.id));
      def.addTransition(makeTransitionEntity(def, s3.id, s1.id));
      expect(() => def.publish()).toThrow(WorkflowCycleDetectedError);
    });

    it('deve rejeitar publish já publicado', () => {
      const def = buildValidDefinition();
      def.publish();
      expect(() => def.publish()).toThrow(PublishedWorkflowImmutableError);
    });
  });

  describe('addStage() / addTransition()', () => {
    it('deve rejeitar slug duplicado de estágio', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: "dup", name: "Dup", order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false }));
      expect(() => def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: "dup", name: "Dup2", order: 2, type: StageType.STANDARD, isInitial: false, isFinal: false })))
        .toThrow('Stage slug already exists');
    });

    it('deve rejeitar transição self-referential', () => {
      const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
      const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: "s1", name: "S1", order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
      def.addStage(s1);
      expect(() => def.addTransition(TransitionEntity.create({ workflowDefinitionId: def.id, slug: "self", name: "Self", fromStageId: s1.id, toStageId: s1.id })))
        .toThrow('Transition cannot be self-referential');
    });

    it('deve rejeitar add stage após publicação', () => {
      const def = buildValidDefinition();
      def.publish();
      expect(() => def.addStage(StageEntity.create({ workflowDefinitionId: def.id, slug: "novo", name: "Novo", order: 4, type: StageType.STANDARD, isInitial: false, isFinal: false })))
        .toThrow(PublishedWorkflowImmutableError);
    });
  });

  describe('removeStage()', () => {
    it('deve remover estágio não-inicial', () => {
      const def = buildValidDefinition();
      const toRemove = def.stages.find(s => s.slug === 'meio')!;
      def.removeStage(toRemove.id);
      expect(def.stages.length).toBe(2);
    });

    it('deve rejeitar remoção do estágio inicial', () => {
      const def = buildValidDefinition();
      const initial = def.stages.find(s => s.isInitial)!;
      expect(() => def.removeStage(initial.id)).toThrow('Cannot remove the initial stage');
    });
  });

  describe('getInitialStage() / getStage()', () => {
    it('deve retornar estágio inicial', () => {
      const def = buildValidDefinition();
      expect(def.getInitialStage().isInitial).toBe(true);
    });

    it('deve retornar estágio por slug', () => {
      const def = buildValidDefinition();
      expect(def.getStageBySlug('fim')).toBeDefined();
      expect(def.getStageBySlug('inexistente')).toBeUndefined();
    });
  });

  function buildValidDefinition(): WorkflowDefinitionEntity {
    const def = WorkflowDefinitionEntity.create(makeDefinitionProps());
    const s1 = StageEntity.create({ workflowDefinitionId: def.id, slug: "inicio", name: "Início", order: 1, type: StageType.INITIAL, isInitial: true, isFinal: false });
    const s2 = StageEntity.create({ workflowDefinitionId: def.id, slug: "meio", name: "Meio", order: 2, type: StageType.STANDARD, isInitial: false, isFinal: false });
    const s3 = StageEntity.create({ workflowDefinitionId: def.id, slug: "fim", name: "Fim", order: 3, type: StageType.FINISH, isInitial: false, isFinal: true });
    def.addStage(s1); def.addStage(s2); def.addStage(s3);
    def.addTransition(makeTransitionEntity(def, s1.id, s2.id));
    def.addTransition(makeTransitionEntity(def, s2.id, s3.id));
    return def;
  }

  function makeTransitionEntity(def: WorkflowDefinitionEntity, from: string, to: string, slug?: string): TransitionEntity {
    const s = slug || `t_${from.slice(0, 4)}_${to.slice(0, 4)}`;
    return TransitionEntity.create({ workflowDefinitionId: def.id, slug: s, name: s, fromStageId: from, toStageId: to });
  }
});
