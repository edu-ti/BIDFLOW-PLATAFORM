import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { randomUUID } from 'crypto';

describe('CRM API — Controllers E2E', () => {
  let app: INestApplication;
  const token = 'e2e-token-' + randomUUID();

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

  describe('GET /api/v1/crm/dashboard/summary', () => {
    it('deve retornar métricas do dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalLeads');
      expect(res.body).toHaveProperty('totalCustomers');
      expect(res.body).toHaveProperty('pipelineValue');
    });
  });

  describe('GET /api/v1/crm/tasks/my', () => {
    it('deve retornar tarefas do usuário autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/tasks/my')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/crm/activities', () => {
    it('deve registrar atividade em lead', async () => {
      const leadRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Atividade Test', email: 'ativ@test.com', source: 'MANUAL' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'CALL',
          subject: 'Ligação de follow-up',
          leadId: leadRes.body.id,
          duration: 15,
          outcome: 'Cliente interessado',
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('CALL');
    });

    it('deve rejeitar activity sem referência (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'NOTE', subject: 'Nota solta' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/crm/tasks lifecycle', () => {
    it('deve criar, completar e verificar timeline', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/crm/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Tarefa E2E',
          assignedTo: randomUUID(),
          priority: 'HIGH',
          leadId: randomUUID(),
        });
      expect(createRes.status).toBe(201);

      const taskId = createRes.body.id;

      const completeRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${token}`);
      expect(completeRes.status).toBe(204);

      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/crm/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.status).toBe('COMPLETED');
    });
  });

  describe('GET /api/v1/crm/timeline', () => {
    it('deve retornar timeline de um lead', async () => {
      const leadRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Timeline Test', email: 'tl@test.com', source: 'MANUAL' });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/crm/timeline/lead/${leadRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/crm/leads/batch', () => {
    it('deve importar leads em lote', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads/batch')
        .set('Authorization', `Bearer ${token}`)
        .send({
          leads: [
            { name: 'Lote 1', email: 'lote1@test.com', source: 'IMPORT' },
            { name: 'Lote 2', email: 'lote2@test.com', source: 'IMPORT' },
          ],
        });
      expect([201, 200]).toContain(res.status);
    });
  });

  describe('GET /api/v1/crm/customers', () => {
    it('deve listar clientes com paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });
  });
});
