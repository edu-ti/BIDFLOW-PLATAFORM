import { TransitionLogEntity } from './transition-log.entity';

export abstract class TransitionLogRepository {
  abstract save(log: TransitionLogEntity): Promise<void>;
  abstract findByInstance(instanceId: string): Promise<TransitionLogEntity[]>;
  abstract countByInstance(instanceId: string): Promise<number>;
}
