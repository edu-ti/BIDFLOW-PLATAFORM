import { TransitionEntity } from './transition.entity';

export interface TransitionRepository {
  save(transition: TransitionEntity): Promise<void>;
  findById(id: string): Promise<TransitionEntity | null>;
  findByDefinition(definitionId: string): Promise<TransitionEntity[]>;
  findAvailable(fromStageId: string): Promise<TransitionEntity[]>;
  findByAutoTriggerEvent(eventType: string, definitionId: string): Promise<TransitionEntity | null>;
  delete(id: string): Promise<void>;
}
