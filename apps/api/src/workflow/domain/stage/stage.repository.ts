import { StageEntity } from './stage.entity';

export abstract class StageRepository {
  abstract save(stage: StageEntity): Promise<void>;
  abstract findById(id: string): Promise<StageEntity | null>;
  abstract findByDefinition(definitionId: string): Promise<StageEntity[]>;
  abstract findInitialStage(definitionId: string): Promise<StageEntity | null>;
  abstract delete(id: string): Promise<void>;
}
