import { strict as assert } from 'assert';
import { AggregateRoot } from '../src/abstractions/aggregate-root';
import { Entity } from '../src/abstractions/entity';
import { ValueObject } from '../src/abstractions/value-object';
import { DomainEvent } from '../src/events/domain-event';
import { DomainException, NotFoundException, ValidationException, ForbiddenException, RateLimitException, SelfApprovalException, BusinessRuleException } from '../src/exceptions';
import { Money, Email, Identifier, Percentage, DateRange } from '../src/value-objects';
import { Guard, Result, Success, Failure } from '../src/types';
import { BasePolicy, CompositePolicy, PolicyResult } from '../src/policies';
import { SimpleRule, RuleSet } from '../src/rules';
import { DomainService } from '../src/services/domain-service';
import { DomainEventMonitor, DomainMetric } from '../src/observability';

describe('@bidflow/domain', () => {

  describe('AggregateRoot', () => {
    class TestAggregate extends AggregateRoot {
      readonly id = 'test-id';
      readonly tenantId = 'tenant-1';
      readonly createdAt = new Date();
      readonly updatedAt = new Date();
      publish() { this.addDomainEvent(new TestEvent(this.id, this.tenantId)); }
    }

    class TestEvent extends DomainEvent {
      readonly type = 'test.event.v1';
      constructor(aggregateId: string, tenantId: string) { super(aggregateId, tenantId); }
    }

    it('should track domain events', () => {
      const agg = new TestAggregate();
      assert.equal(agg.domainEvents.length, 0);
      agg.publish();
      assert.equal(agg.domainEvents.length, 1);
    });

    it('should clear events', () => {
      const agg = new TestAggregate();
      agg.publish();
      agg.clearEvents();
      assert.equal(agg.domainEvents.length, 0);
    });
  });

  describe('Entity', () => {
    class TestEntity extends Entity {
      readonly id = 'entity-1';
      readonly tenantId = 'tenant-1';
      doAction() { this.addDomainEvent(new TestEvent(this.id, this.tenantId)); }
    }
    class TestEvent extends DomainEvent {
      readonly type = 'test.entity.event';
      constructor(aggregateId: string, tenantId: string) { super(aggregateId, tenantId); }
    }

    it('should track events', () => {
      const e = new TestEntity();
      e.doAction();
      assert.equal(e.domainEvents.length, 1);
    });
  });

  describe('ValueObject', () => {
    class TestMoney extends ValueObject {
      constructor(readonly amount: number, readonly currency: string) { super(); }
    }

    it('should compare by value', () => {
      const a = new TestMoney(100, 'BRL');
      const b = new TestMoney(100, 'BRL');
      const c = new TestMoney(200, 'BRL');
      assert.ok(a.equals(b));
      assert.ok(!a.equals(c));
    });
  });

  describe('DomainEvent', () => {
    class TestEvent extends DomainEvent {
      readonly type = 'com.bidflow.test.event.v1';
    }

    it('should generate eventId', () => {
      const e = new TestEvent('agg-1', 't-1');
      assert.ok(e.eventId);
      assert.equal(e.aggregateId, 'agg-1');
      assert.equal(e.tenantId, 't-1');
    });

    it('should build routing key', () => {
      const e = new TestEvent('agg-1', 't-1');
      assert.equal(e.routingKey, 't-1.com.bidflow.test.event');
    });
  });

  describe('Exceptions', () => {
    it('should create typed exceptions', () => {
      const nf = new NotFoundException('User', '123');
      assert.equal(nf.code, 'NOT_FOUND');
      assert.equal(nf.statusCode, 404);

      const val = new ValidationException('Invalid');
      assert.equal(val.statusCode, 422);

      const forb = new ForbiddenException('No access');
      assert.equal(forb.statusCode, 403);

      const rate = new RateLimitException();
      assert.equal(rate.statusCode, 429);

      const self = new SelfApprovalException();
      assert.equal(self.code, 'SELF_APPROVAL_DENIED');
    });
  });

  describe('Value Objects', () => {
    it('Money should create and validate', () => {
      const m = new Money(100, 'BRL');
      assert.equal(m.amount, 100);
      assert.throws(() => new Money(-100, 'BRL'));
      assert.throws(() => new Money(100, 'INVALID'));
    });

    it('Money should support operations', () => {
      const a = new Money(100, 'BRL');
      const b = new Money(50, 'BRL');
      assert.equal(a.add(b).amount, 150);
      assert.equal(a.subtract(b).amount, 50);
      assert.throws(() => a.add(new Money(10, 'USD')));
    });

    it('Email should validate and normalize', () => {
      const e = new Email('Test@Example.COM');
      assert.equal(e.value, 'test@example.com');
      assert.throws(() => new Email('invalid'));
    });

    it('DateRange should validate', () => {
      const dr = new DateRange(new Date('2026-01-01'), new Date('2026-12-31'));
      assert.ok(dr.contains(new Date('2026-06-15')));
      assert.throws(() => new DateRange(new Date('2026-12-31'), new Date('2026-01-01')));
    });
  });

  describe('Policies', () => {
    it('should evaluate composite policy (all)', () => {
      class AllowPolicy extends BasePolicy {
        readonly name = 'allow';
        evaluate(_ctx: unknown): PolicyResult { return { allowed: true }; }
      }
      class DenyPolicy extends BasePolicy {
        readonly name = 'deny';
        evaluate(_ctx: unknown): PolicyResult { return { allowed: false, reason: 'denied' }; }
      }
      const composite = new CompositePolicy([new AllowPolicy(), new DenyPolicy()], 'all');
      assert.equal(composite.evaluate({}).allowed, false);
    });
  });

  describe('Rules', () => {
    it('should evaluate rule set', () => {
      const rs = new RuleSet();
      rs.add(new SimpleRule('R1', 'Rule 1', 'Failed', () => true));
      rs.add(new SimpleRule('R2', 'Rule 2', 'Failed', () => false));
      const result = rs.checkAll();
      assert.equal(result.valid, false);
      assert.equal(result.violations.length, 1);
    });
  });

  describe('DomainService', () => {
    it('should validate conditions', () => {
      class TestService extends DomainService {
        run(): void { this.validate(true, 'ok'); }
      }
      const svc = new TestService();
      svc.run(); // should not throw
    });
  });

  describe('Observability', () => {
    it('DomainEventMonitor should record events', () => {
      const mon = new DomainEventMonitor();
      mon.record('test.event', 'agg-1');
      assert.equal(mon.count(), 1);
    });

    it('DomainMetric should track counters', () => {
      const m = new DomainMetric();
      m.increment('requests');
      m.increment('requests');
      assert.equal(m.getCounter('requests'), 2);
    });
  });

  describe('Guard', () => {
    it('should guard conditions', () => {
      assert.throws(() => Guard.againstEmptyString('', 'field'));
      assert.throws(() => Guard.againstNegative(-1, 'value'));
      assert.throws(() => Guard.againstNull(null, 'value'));
    });
  });

  describe('Result', () => {
    it('should create Success', () => {
      const r: Result<string> = new Success('done');
      assert.equal(r.success, true);
      if (r.success) assert.equal(r.value, 'done');
    });

    it('should create Failure', () => {
      const r: Result<string> = new Failure(new Error('fail'));
      assert.equal(r.success, false);
    });
  });
});
