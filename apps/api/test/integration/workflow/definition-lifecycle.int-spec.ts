import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Workflow Integration — Definition Lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tenantId = randomUUID();
  const token = 'wf-test-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('deve criar definição, adicionar estágios, publicar e criar instância', async () => {
    // 1. Criar definição
    const defRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/definitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fluxo Teste', slug: 'fluxo-teste', entityType: 'test.entity' });
    expect(defRes.status).toBe(201);
    const defId = defRes.body.id;

    // 2. Adicionar estágio inicial
    const s1 = await request(app.getHttpServer())
      .post(`/api/v1/workflow/definitions/${defId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'inicio', name: 'Início', order: 1, type: 'INITIAL', isInitial: true, isFinal: false });
    expect(s1.status).toBe(201);

    // 3. Adicionar estágio final
    const s2 = await request(app.getHttpServer())
      .post(`/api/v1/workflow/definitions/${defId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'fim', name: 'Fim', order: 2, type: 'FINISH', isInitial: false, isFinal: true });
    expect(s2.status).toBe(201);

    // 4. Adicionar transição
    const t1 = await request(app.getHttpServer())
      .post(`/api/v1/workflow/definitions/${defId}/transitions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'finalizar', name: 'Finalizar', fromStageId: s1.body.id, toStageId: s2.body.id });
    expect(t1.status).toBe(201);

    // 5. Publicar
    const pubRes = await request(app.getHttpServer())
      .post(`/api/v1/workflow/definitions/${defId}/publish`)
      .set('Authorization', `Bearer ${token}`);
    expect(pubRes.status).toBe(200);

    // 6. Criar instância
    const instRes = await request(app.getHttpServer())
      .post('/api/v1/workflow/instances')
      .set('Authorization', `Bearer ${token}`)
      .send({ workflowDefinitionId: defId, entityType: 'test.entity', entityId: randomUUID(), title: 'Teste' });
    expect(instRes.status).toBe(201);
    expect(instRes.body.status).toBe('ACTIVE');
  });
});
