import { strict as assert } from 'assert';
import { decodeJwt, isTokenExpired, hasPermission, extractTenantContext } from '../src/auth';
import { withRetry, ResponseError, calculateBackoff } from '../src/retry';
import { tenantHeaders, tenantCacheKey, tenantRoutingKey } from '../src/tenant';
import { apiGet, apiPost, buildRequest } from '../src/api';
import { Endpoints } from '../src/constants/endpoints';
import { PaginatedResponse, ApiError, TenderStatus } from '../src/types';
import { ConsoleLogger, NoopMetrics } from '../src/observability';
import { NoopTracer, buildTraceparent } from '../src/tracing';

describe('@bidflow/sdk', () => {

  describe('auth', () => {
    it('should decode JWT payload', () => {
      const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJ0ZW5hbnRJZCI6InQtMSIsInJvbGVzIjpbIkFETUlOIl0sInBlcm1pc3Npb25zIjpbInRlbmRlci5jcmVhdGUiXSwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
      const payload = decodeJwt(token);
      assert.ok(payload);
      assert.equal(payload!.sub, 'user-1');
      assert.equal(payload!.tenantId, 't-1');
      assert.ok(payload!.permissions.includes('tender.create'));
    });

    it('should return null for invalid JWT', () => {
      assert.equal(decodeJwt('invalid'), null);
    });

    it('should check token expiration', () => {
      const valid = 'eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';
      assert.equal(isTokenExpired(valid), false);
    });

    it('should check permissions with wildcard', () => {
      assert.ok(hasPermission(['tender.*'], 'tender.create'));
      assert.ok(hasPermission(['tender.create'], 'tender.create'));
      assert.ok(!hasPermission(['tender.read'], 'tender.create'));
    });

    it('should extract tenant context from JWT', () => {
      const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJ0ZW5hbnRJZCI6InQtMSIsInJvbGVzIjpbIkFETUlOIl19.signature';
      const ctx = extractTenantContext(token);
      assert.ok(ctx);
      assert.equal(ctx!.tenantId, 't-1');
    });
  });

  describe('retry', () => {
    it('should calculate backoff with jitter', () => {
      const delay = calculateBackoff(1, { maxAttempts: 3, initialBackoffMs: 1000, maxBackoffMs: 30000, backoffMultiplier: 2 });
      assert.ok(delay >= 1000);
      assert.ok(delay <= 1100);
    });

    it('should succeed on first attempt', async () => {
      const result = await withRetry(async () => 'ok');
      assert.equal(result, 'ok');
    });

    it('should throw ResponseError for non-retryable status', async () => {
      await assert.rejects(
        () => withRetry(async () => { throw new ResponseError('Bad request', 400, 'VALIDATION'); }),
      );
    });
  });

  describe('tenant', () => {
    it('should build tenant headers', () => {
      const headers = tenantHeaders({ tenantId: 't-1', userId: 'u-1', role: 'ADMIN' });
      assert.equal(headers['X-Tenant-Id'], 't-1');
      assert.equal(headers['X-User-Id'], 'u-1');
    });

    it('should build cache key with prefix', () => {
      assert.equal(tenantCacheKey('t-1', 'leads:list'), 't-1:leads:list');
    });

    it('should build routing key', () => {
      assert.equal(tenantRoutingKey('t-1', 'tender.captured'), 't-1.tender.captured');
    });
  });

  describe('api', () => {
    it('should build GET request', () => {
      const req = buildRequest('/api/v1/leads', { token: 'jwt', tenantId: 't-1' });
      assert.equal((req.headers as Record<string, string>)['Authorization'], 'Bearer jwt');
      assert.equal((req.headers as Record<string, string>)['X-Tenant-Id'], 't-1');
    });

    it('should build POST request with body', () => {
      const req = buildRequest('/api/v1/leads', {
        method: 'POST', body: { name: 'Test' }, token: 'jwt',
      });
      assert.equal((req.headers as Record<string, string>)['Content-Type'], 'application/json');
      assert.equal(req.body, JSON.stringify({ name: 'Test' }));
    });
  });

  describe('constants', () => {
    it('should have all required endpoints', () => {
      assert.ok(Endpoints.LEADS);
      assert.ok(Endpoints.WORKFLOW_INSTANCES);
      assert.ok(Endpoints.TENDERS);
      assert.ok(Endpoints.LOGIN);
    });

    it('should build dynamic endpoints', () => {
      assert.equal(Endpoints.LEAD_BY_ID('123'), '/api/v1/crm/leads/123');
      assert.equal(Endpoints.TENDER_BY_ID('456'), '/api/v1/tenders/456');
    });
  });

  describe('observability', () => {
    it('should log messages', () => {
      const logger = new ConsoleLogger();
      logger.info('test'); // should not throw
    });

    it('should collect metrics', () => {
      const metrics = new NoopMetrics();
      metrics.increment('test'); // should not throw
    });
  });

  describe('tracing', () => {
    it('should build traceparent header', () => {
      const tp = buildTraceparent('abcdef0123456789abcdef0123456789', 'abcdef0123456789');
      assert.ok(tp.startsWith('00-'));
    });

    it('should trace spans without throwing', async () => {
      const tracer = new NoopTracer();
      const result = await tracer.withSpan('test', async () => 'done');
      assert.equal(result, 'done');
    });
  });

  describe('types', () => {
    it('should allow valid TenderStatus values', () => {
      const status: TenderStatus = 'WON';
      assert.equal(status, 'WON');
    });

    it('should type PaginatedResponse correctly', () => {
      const res: PaginatedResponse<string> = {
        data: ['a'], total: 1, page: 1, limit: 20, totalPages: 1, hasNext: false,
      };
      assert.equal(res.data[0], 'a');
    });

    it('should type ApiError', () => {
      const err: ApiError = { statusCode: 404, message: 'Not found', code: 'NOT_FOUND' };
      assert.equal(err.code, 'NOT_FOUND');
    });
  });
});
