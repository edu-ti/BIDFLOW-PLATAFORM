import { TransitionLogEntity } from './transition-log.entity';

export interface TransitionLogRepository {
  save(log: TransitionLogEntity): Promise<void>;
  findByInstance(instanceId: string): Promise<TransitionLogEntity[]>;
  countByInstance(instanceId: string): Promise<number>;
}
