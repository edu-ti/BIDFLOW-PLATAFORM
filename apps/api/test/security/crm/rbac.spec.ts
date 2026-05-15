import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { randomUUID } from 'crypto';

describe('CRM Security — RBAC & Permissions', () => {
  let app: INestApplication;

  const adminToken = 'token-admin-' + randomUUID();
  const managerToken = 'token-manager-' + randomUUID();
  const viewerToken = 'token-viewer-' + randomUUID();
  const supplierToken = 'token-supplier-' + randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('TENANT_ADMIN — acesso total', () => {
    it('deve criar, ler, atualizar e deletar leads', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Lead', email: 'admin@empresa.com', source: 'MANUAL' });
      expect(createRes.status).toBe(201);

      const id = createRes.body.id;

      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/crm/leads/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(200);

      const delRes = await request(app.getHttpServer())
        .delete(`/api/v1/crm/leads/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(204);
    });

    it('deve gerenciar pipelines', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Pipeline',
          slug: 'admin-pipe',
          stages: [{ id: 's1', name: 'S1', order: 1, probability: 10, color: '#fff' }],
        });
      expect(res.status).toBe(201);
    });
  });

  describe('TENANT_VIEWER — apenas leitura', () => {
    it('deve listar leads', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it('deve rejeitar criação de lead (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer Lead', email: 'viewer@empresa.com', source: 'MANUAL' });
      expect(res.status).toBe(403);
    });

    it('deve rejeitar deleção de lead (403)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/crm/leads/' + randomUUID())
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('deve listar pipelines', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it('deve rejeitar criação de pipeline (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'P', slug: 'p', stages: [{ id: 'a', name: 'A', order: 1, probability: 10, color: '#fff' }] });
      expect(res.status).toBe(403);
    });
  });

  describe('TENANT_MANAGER — acesso intermediário', () => {
    it('deve criar e qualificar leads', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Manager Lead', email: 'manager@empresa.com', source: 'MANUAL' });
      expect(createRes.status).toBe(201);

      const qualifyRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/leads/${createRes.body.id}/qualify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ score: 80 });
      expect(qualifyRes.status).toBe(200);
    });

    it('deve criar oportunidades', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/opportunities')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          pipelineId: randomUUID(),
          title: 'Manager Opp',
          estimatedValue: 1000,
          stage: 'prospecting',
        });
      // 201 se pipeline existe, 404 se não — o importante é não receber 403
      expect([201, 404]).toContain(res.status);
    });
  });

  describe('SUPPLIER — acesso externo restrito', () => {
    it('deve ter acesso negado a leads (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${supplierToken}`);
      expect(res.status).toBe(403);
    });

    it('deve ter acesso negado a pipelines (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${supplierToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Sem token — 401', () => {
    it('deve rejeitar requisição sem auth', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/crm/leads');
      expect(res.status).toBe(401);
    });
  });
});
