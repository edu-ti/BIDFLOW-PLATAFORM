import { TransitionEntity } from './transition.entity';

export abstract class TransitionRepository {
  abstract save(transition: TransitionEntity): Promise<void>;
  abstract findById(id: string): Promise<TransitionEntity | null>;
  abstract findByDefinition(definitionId: string): Promise<TransitionEntity[]>;
  abstract findAvailable(fromStageId: string): Promise<TransitionEntity[]>;
  abstract findByAutoTriggerEvent(eventType: string, definitionId: string): Promise<TransitionEntity | null>;
  abstract delete(id: string): Promise<void>;
}
