import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('CRM Integration — Lead Flow (POST /api/v1/crm/leads)', () => {
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

    // Setup: criar tenant + usuário + token JWT
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "tenant_${tenantId.replace(/-/g, '_')}"`);
    accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock';
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "tenant_${tenantId.replace(/-/g, '_')}" CASCADE`);
    await app.close();
  });

  describe('POST /api/v1/crm/leads', () => {
    const validLead = {
      name: 'Carlos Almeida',
      email: 'carlos@empresa.com.br',
      phone: '+5511999998888',
      company: 'Empresa Exemplo Ltda',
      source: 'INDICATION',
      tags: ['hot', 'enterprise'],
    };

    it('deve criar lead com dados mínimos e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validLead);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Carlos Almeida');
      expect(res.body.status).toBe('NEW');
      expect(res.body.score).toBe(0);
    });

    it('deve rejeitar lead sem name (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'teste@teste.com', source: 'MANUAL' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('name');
    });

    it('deve rejeitar email inválido (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validLead, email: 'nao-email' });

      expect(res.status).toBe(400);
    });

    it('deve criar timeline entry automaticamente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validLead);

      expect(res.status).toBe(201);

      const timelineRes = await request(app.getHttpServer())
        .get(`/api/v1/crm/timeline/lead/${res.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(timelineRes.status).toBe(200);
      expect(timelineRes.body.length).toBeGreaterThanOrEqual(1);
      expect(timelineRes.body[0].type).toBe('SYSTEM_EVENT');
    });
  });

  describe('POST /api/v1/crm/leads/:id/qualify', () => {
    it('deve qualificar lead e disparar evento', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'João', email: 'joao@empresa.com', source: 'MANUAL' });

      const leadId = createRes.body.id;

      const qualifyRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/leads/${leadId}/qualify`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ score: 85, criteria: { profileFit: 90, engagement: 80 } });

      expect(qualifyRes.status).toBe(200);
      expect(qualifyRes.body.status).toBe('QUALIFIED');
      expect(qualifyRes.body.score).toBe(85);
    });
  });

  describe('POST /api/v1/crm/leads/:id/convert', () => {
    it('deve converter lead em cliente e retornar 201', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Maria', email: 'maria@empresa.com', source: 'MANUAL' });

      const leadId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/crm/leads/${leadId}/qualify`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ score: 90 });

      const convertRes = await request(app.getHttpServer())
        .post(`/api/v1/crm/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          legalName: 'Maria Ltda',
          taxId: '99.999.999/0001-99',
          segment: 'PRIVATE',
          tier: 'GOLD',
        });

      expect(convertRes.status).toBe(201);
      expect(convertRes.body.customerId).toBeDefined();
      expect(convertRes.body.customerName).toBe('Maria Ltda');
    });
  });
});
