import { StageEntity } from './stage.entity';

export interface StageRepository {
  save(stage: StageEntity): Promise<void>;
  findById(id: string): Promise<StageEntity | null>;
  findByDefinition(definitionId: string): Promise<StageEntity[]>;
  findInitialStage(definitionId: string): Promise<StageEntity | null>;
  delete(id: string): Promise<void>;
}
