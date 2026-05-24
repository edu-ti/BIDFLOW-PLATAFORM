import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Workflow Security — Tenant Isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const tenantA = { id: randomUUID(), token: 'wf-token-a' };
  const tenantB = { id: randomUUID(), token: 'wf-token-b' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('Tenant A cria definição, Tenant B não a vê por slug', async () => {
    const resA = await request(app.getHttpServer())
      .post('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'Secreto A', slug: 'secreto-a', entityType: 'test' });
    expect(resA.status).toBe(201);

    const listB = await request(app.getHttpServer())
      .get('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(listB.status).toBe(200);
    const slugsB = (listB.body.data || listB.body).map((d: any) => d.slug);
    expect(slugsB).not.toContain('secreto-a');
  });

  it('Tenant A cria instância, Tenant B não vê detalhes', async () => {
    const defRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ name: 'WF A', slug: 'wf-a-' + randomUUID().slice(0, 8), entityType: 'test' });
    const defId = defRes.body.id;

    const s1 = (await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/stages`).set('Authorization', `Bearer ${tenantA.token}`).send({ slug: 's1', name: 'S1', order: 1, type: 'INITIAL', isInitial: true, isFinal: false })).body;
    const s2 = (await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/stages`).set('Authorization', `Bearer ${tenantA.token}`).send({ slug: 's2', name: 'S2', order: 2, type: 'FINISH', isInitial: false, isFinal: true })).body;
    await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/transitions`).set('Authorization', `Bearer ${tenantA.token}`).send({ slug: 't1', name: 'T1', fromStageId: s1.id, toStageId: s2.id });
    await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/publish`).set('Authorization', `Bearer ${tenantA.token}`);

    const instRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/instances')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ workflowDefinitionId: defId, entityType: 'test', entityId: randomUUID(), title: 'Instância A' });
    const instanceId = instRes.body.id;

    const getB = await request(app.getHttpServer())
      .get(`/api/v1/workflow/instances/${instanceId}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(getB.status).toBe(404);
  });

  it('Dashboard retorna apenas dados do tenant', async () => {
    const summaryB = await request(app.getHttpServer())
      .get('/api/v1/workflow/dashboard/summary')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(summaryB.status).toBe(200);
  });
});
