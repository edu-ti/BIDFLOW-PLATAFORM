import { CloudEventEnvelope } from '../src/contracts/cloud-event';
import { buildEnvelope, routingKey, isValidEventType } from '../src/utils';
import { EventTypes } from '../src/constants/event-types';
import { extractVersion, baseEventType } from '../src/versioning';
import { buildEventSpanAttrs } from '../src/tracing';
import { buildEventObsEntry, EventProcessingResult } from '../src/observability';
import { strict as assert } from 'assert';

describe('@bidflow/events', () => {

  describe('CloudEventEnvelope', () => {
    it('should build a valid envelope', () => {
      const payload = { instanceId: '550e8400-e29b-41d4-a716-446655440000' };
      const envelope = buildEnvelope(EventTypes.WORKFLOW_STARTED, payload, {
        tenantId: '770e8400-e29b-41d4-a716-446655440000',
        source: '/api/v1/workflow/instances',
        subject: '550e8400',
      });

      assert.equal(envelope.specversion, '1.0');
      assert.equal(envelope.type, EventTypes.WORKFLOW_STARTED);
      assert.equal(envelope.tenantid, '770e8400-e29b-41d4-a716-446655440000');
      assert.equal(envelope.data.instanceId, '550e8400-e29b-41d4-a716-446655440000');
      assert.ok(envelope.id);
      assert.ok(envelope.time);
    });

    it('should include optional fields when provided', () => {
      const envelope = buildEnvelope(EventTypes.WORKFLOW_STARTED, {}, {
        tenantId: 'a', source: '/test', subject: 's',
        userId: 'user-1', correlationId: 'corr-1', causationId: 'caus-1',
      });

      assert.equal(envelope.userid, 'user-1');
      assert.equal(envelope.correlationid, 'corr-1');
      assert.equal(envelope.causationid, 'caus-1');
    });
  });

  describe('routingKey', () => {
    it('should build routing key from tenant ID and event type', () => {
      const key = routingKey('tenant-1', 'com.bidflow.workflow.stage.changed.v1');
      assert.equal(key, 'tenant-1.workflow.stage.changed');
    });
  });

  describe('isValidEventType', () => {
    it('should validate known event types', () => {
      assert.ok(isValidEventType('com.bidflow.workflow.instance.started.v1'));
      assert.ok(!isValidEventType('invalid.event'));
    });
  });

  describe('versioning', () => {
    it('should extract version from event type', () => {
      assert.equal(extractVersion('com.bidflow.test.v1'), 'v1');
      assert.equal(extractVersion('com.bidflow.test.v2'), 'v2');
    });

    it('should return null for unversioned types', () => {
      assert.equal(extractVersion('com.bidflow.test'), null);
    });

    it('should extract base event type without version', () => {
      assert.equal(baseEventType('com.bidflow.test.v1'), 'com.bidflow.test');
    });
  });

  describe('tracing', () => {
    it('should build span attributes', () => {
      const attrs = buildEventSpanAttrs('evt-1', 'test.event', 't-1', 'agg-1', 'corr-1');
      assert.equal(attrs['event.id'], 'evt-1');
      assert.equal(attrs['event.type'], 'test.event');
      assert.equal(attrs['messaging.system'], 'rabbitmq');
    });
  });

  describe('observability', () => {
    it('should build observability entry', () => {
      const entry = buildEventObsEntry('evt-1', 'test', 't-1', 'agg-1', 'success', 42, 1);
      assert.equal(entry.eventId, 'evt-1');
      assert.equal(entry.durationMs, 42);
      assert.equal(entry.result, 'success');
    });
  });

  describe('EventTypes constants', () => {
    it('should have all required event types', () => {
      assert.ok(EventTypes.WORKFLOW_STARTED);
      assert.ok(EventTypes.WORKFLOW_STAGE_CHANGED);
      assert.ok(EventTypes.WORKFLOW_APPROVAL_GRANTED);
      assert.ok(EventTypes.WORKFLOW_COMPLETED);
      assert.ok(EventTypes.TENDER_CAPTURED);
      assert.ok(EventTypes.LEAD_CAPTURED);
      assert.ok(EventTypes.TENANT_REGISTERED);
    });
  });
});
