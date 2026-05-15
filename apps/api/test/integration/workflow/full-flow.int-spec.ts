import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Workflow Integration — Full Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tenantId = randomUUID();
  const token = 'wf-full-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('deve executar workflow completo: criar → transicionar → completar', async () => {
    // Setup definição com 3 estágios
    const defRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Full Flow', slug: 'full-flow', entityType: 'test.entity' });
    const defId = defRes.body.id;

    const s1 = (await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/stages`).set('Authorization', `Bearer ${token}`).send({ slug: 'a', name: 'A', order: 1, type: 'INITIAL', isInitial: true, isFinal: false })).body;
    const s2 = (await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/stages`).set('Authorization', `Bearer ${token}`).send({ slug: 'b', name: 'B', order: 2, type: 'STANDARD', isInitial: false, isFinal: false })).body;
    const s3 = (await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/stages`).set('Authorization', `Bearer ${token}`).send({ slug: 'c', name: 'C', order: 3, type: 'FINISH', isInitial: false, isFinal: true })).body;

    await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/transitions`).set('Authorization', `Bearer ${token}`).send({ slug: 'ab', name: 'AB', fromStageId: s1.id, toStageId: s2.id });
    await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/transitions`).set('Authorization', `Bearer ${token}`).send({ slug: 'bc', name: 'BC', fromStageId: s2.id, toStageId: s3.id });
    await request(app.getHttpServer()).post(`/api/v1/workflow/definitions/${defId}/publish`).set('Authorization', `Bearer ${token}`);

    // Criar instância
    const entityId = randomUUID();
    const instRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/instances')
      .set('Authorization', `Bearer ${token}`)
      .send({ workflowDefinitionId: defId, entityType: 'test.entity', entityId, title: 'Full Flow Test' });
    expect(instRes.status).toBe(201);
    const instanceId = instRes.body.id;

    // Executar transição 1
    const t1Res = await request(app.getHttpServer())
      .post(`/api/v1/workflow/instances/${instanceId}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ transitionSlug: 'ab' });
    expect(t1Res.status).toBe(200);
    expect(t1Res.body.currentStage).toBe(s2.id);

    // Executar transição 2
    const t2Res = await request(app.getHttpServer())
      .post(`/api/v1/workflow/instances/${instanceId}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ transitionSlug: 'bc' });
    expect(t2Res.status).toBe(200);
    expect(t2Res.body.status).toBe('COMPLETED');

    // Verificar timeline
    const tlRes = await request(app.getHttpServer())
      .get(`/api/v1/workflow/instances/${instanceId}/timeline`)
      .set('Authorization', `Bearer ${token}`);
    expect(tlRes.status).toBe(200);
    expect(tlRes.body.length).toBeGreaterThanOrEqual(2);

    // Verificar dashboard
    const summaryRes = await request(app.getHttpServer())
      .get('/api/v1/workflow/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summaryRes.status).toBe(200);
  });
});
