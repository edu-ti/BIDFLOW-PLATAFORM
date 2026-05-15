// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Serializers
// ═══════════════════════════════════════════════════════════════════════════

import { CloudEventEnvelope } from '../contracts/cloud-event';

export type SerializedEvent = string;
export type BrokerMessage = { body: Buffer; headers: Record<string, string> };

/**
 * Serializer interface — converts CloudEventEnvelope to/from broker format.
 */
export interface IEventSerializer {
  /** Serialize envelope to broker message */
  serialize<T>(envelope: CloudEventEnvelope<T>): BrokerMessage;

  /** Deserialize broker message to envelope */
  deserialize<T>(message: BrokerMessage): CloudEventEnvelope<T>;
}

/**
 * JSON serializer implementation.
 */
export class JsonEventSerializer implements IEventSerializer {
  serialize<T>(envelope: CloudEventEnvelope<T>): BrokerMessage {
    const json = JSON.stringify(envelope);
    return {
      body: Buffer.from(json, 'utf-8'),
      headers: {
        'content-type': 'application/cloudevents+json',
        'ce-specversion': envelope.specversion,
        'ce-id': envelope.id,
        'ce-type': envelope.type,
        'ce-source': envelope.source,
        'ce-tenantid': envelope.tenantid,
      },
    };
  }

  deserialize<T>(message: BrokerMessage): CloudEventEnvelope<T> {
    const json = message.body.toString('utf-8');
    return JSON.parse(json) as CloudEventEnvelope<T>;
  }
}

/**
 * Avro serializer (future — for Kafka Schema Registry).
 */
export class AvroEventSerializer implements IEventSerializer {
  serialize<T>(_envelope: CloudEventEnvelope<T>): BrokerMessage {
    throw new Error('Avro serializer not implemented yet');
  }
  deserialize<T>(_message: BrokerMessage): CloudEventEnvelope<T> {
    throw new Error('Avro serializer not implemented yet');
  }
}
