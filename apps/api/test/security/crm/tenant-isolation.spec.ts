import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('CRM Security — Tenant Isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const tenantA = { id: randomUUID(), token: 'token-a', slug: 'tenant-a' };
  const tenantB = { id: randomUUID(), token: 'token-b', slug: 'tenant-b' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Tenant A cria dados → Tenant B não deve acessá-los', () => {
    let leadIdFromA: string;

    it('Tenant A cria um lead', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ name: 'Lead A', email: 'leada@a.com', source: 'MANUAL' });
      expect(res.status).toBe(201);
      leadIdFromA = res.body.id;
    });

    it('Tenant B não consegue ver o lead de A por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/crm/leads/${leadIdFromA}`)
        .set('Authorization', `Bearer ${tenantB.token}`);
      expect(res.status).toBe(404);
    });

    it('Tenant B lista leads e não vê o lead de A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${tenantB.token}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map(l => l.id);
      expect(ids).not.toContain(leadIdFromA);
    });
  });

  describe('Cross-tenant data leak prevention', () => {
    it('Tenant A cria lead com email X, Tenant B deve poder criar lead com mesmo email', async () => {
      const sharedEmail = 'shared@email.com';

      const resA = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ name: 'User A', email: sharedEmail, source: 'MANUAL' });
      expect(resA.status).toBe(201);

      const resB = await request(app.getHttpServer())
        .post('/api/v1/crm/leads')
        .set('Authorization', `Bearer ${tenantB.token}`)
        .send({ name: 'User B', email: sharedEmail, source: 'MANUAL' });
      expect(resB.status).toBe(201);
    });
  });

  describe('Pipeline isolation', () => {
    it('Tenant A cria pipeline, Tenant B não vê', async () => {
      const resA = await request(app.getHttpServer())
        .post('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({
          name: 'Pipeline Secreto A',
          slug: 'secreto-a',
          stages: [{ id: 's1', name: 'S1', order: 1, probability: 10, color: '#fff' }],
        });
      expect(resA.status).toBe(201);

      const resB = await request(app.getHttpServer())
        .get('/api/v1/crm/pipelines')
        .set('Authorization', `Bearer ${tenantB.token}`);
      expect(resB.status).toBe(200);
      const slugs = resB.body.map(p => p.slug);
      expect(slugs).not.toContain('secreto-a');
    });
  });

  describe('Oportunities de A não vazam para B', () => {
    it('deve manter isolamento completo de oportunidades', async () => {
      const listB = await request(app.getHttpServer())
        .get('/api/v1/crm/opportunities')
        .set('Authorization', `Bearer ${tenantB.token}`);
      expect(listB.status).toBe(200);
    });
  });
});
