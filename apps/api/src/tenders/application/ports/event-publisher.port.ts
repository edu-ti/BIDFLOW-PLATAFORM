export interface IEventPublisher {
  publish(event: any): Promise<void>;
  publishAll(events: any[]): Promise<void>;
}
