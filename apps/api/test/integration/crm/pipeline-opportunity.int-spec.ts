import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('CRM Integration — Pipeline & Opportunity', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const tenantId = randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();

    accessToken = 'mock-token-' + tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Pipelines CRUD', () => {
    it('deve criar pipeline com estágios', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Vendas Diretas',
          slug: 'vendas-diretas',
          isDefault: true,
          stages: [
            { id: 'qualificacao', name: 'Qualificação', order: 1, probability: 10, color: '#e8f5e9' },
            { id: 'proposta', name: 'Proposta', order: 2, probability: 50, color: '#a5d6a7' },
            { id: 'fechamento', name: 'Fechamento', order: 3, probability: 90, color: '#66bb6a' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Vendas Diretas');
    });
  });

  describe('Opportunity Workflow', () => {
    it('deve criar oportunidade e avançar estágios até WON', async () => {
      // Criar pipeline
      const pipeRes = await request(app.getHttpServer())
        .post('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Pipeline Teste',
          slug: 'pipeline-teste',
          isDefault: true,
          stages: [
            { id: 'inicio', name: 'Início', order: 1, probability: 10, color: '#fff' },
            { id: 'meio', name: 'Meio', order: 2, probability: 50, color: '#fff' },
            { id: 'fim', name: 'Fim', order: 3, probability: 90, color: '#fff' },
          ],
        });

      const pipelineId = pipeRes.body.id;

      // Criar cliente
      const custRes = await request(app.getHttpServer())
        .post('/api/v1/crm/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          legalName: 'Cliente Teste Ltda',
          taxId: '11.111.111/0001-11',
          email: 'cliente@teste.com',
          segment: 'PRIVATE',
          tier: 'BRONZE',
        });

      const customerId = custRes.body.id;

      // Criar oportunidade
      const oppRes = await request(app.getHttpServer())
        .post('/api/v1/crm/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          pipelineId,
          customerId,
          title: 'Venda de Software',
          estimatedValue: 100000,
          stage: 'inicio',
          expectedCloseDate: '2026-07-30',
        });

      expect(oppRes.status).toBe(201);
      expect(oppRes.body.status).toBe('OPEN');

      const opportunityId = oppRes.body.id;

      // Avançar estágio
      const moveRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/opportunities/${opportunityId}/move-stage`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ toStage: 'meio' });

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.stage).toBe('meio');

      // Avançar para fim
      await request(app.getHttpServer())
        .post(`/api/v1/crm/opportunities/${opportunityId}/move-stage`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ toStage: 'fim' });

      // Ganhar oportunidade
      const winRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/opportunities/${opportunityId}/win`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ wonValue: 95000, actualCloseDate: '2026-06-15' });

      expect(winRes.status).toBe(200);
      expect(winRes.body.status).toBe('WON');
      expect(winRes.body.wonValue).toBe(95000);
    });
  });
});
