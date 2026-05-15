import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Workflow API — Controllers E2E', () => {
  let app: INestApplication;
  const token = 'api-test-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('GET /workflow/definitions retorna lista', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('GET /workflow/definitions/:id retorna 404 para ID inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workflow/definitions/' + randomUUID())
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET /workflow/dashboard/summary retorna métricas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workflow/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalActive');
  });

  it('GET /workflow/dashboard/my-pending retorna pendências', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workflow/dashboard/my-pending')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('approvals');
    expect(res.body).toHaveProperty('tasks');
  });

  it('GET /workflow/dashboard/overdue retorna instâncias vencidas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workflow/dashboard/overdue')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('DELETE /workflow/definitions/:id retorna 404 para ID inexistente', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/v1/workflow/definitions/' + randomUUID())
      .set('Authorization', `Bearer ${token}`);
    expect([204, 404]).toContain(res.status);
  });

  it('POST /workflow/instances sem definitionId retorna 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/workflow/instances')
      .set('Authorization', `Bearer ${token}`)
      .send({ entityType: 'test', entityId: randomUUID(), title: 'Test' });
    expect(res.status).toBe(400);
  });
});
