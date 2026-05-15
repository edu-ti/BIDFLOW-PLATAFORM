import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PrismaLeadRepository } from '../../../src/crm/infrastructure/persistence/prisma/lead/prisma-lead.repository';
import { LeadRepository } from '../../../src/crm/domain/lead/lead.repository';
import { LeadEntity } from '../../../src/crm/domain/lead/lead.entity';
import { LeadStatus } from '../../../src/crm/domain/common/enums/lead-status.enum';

describe('PrismaLeadRepository — Repository', () => {
  let repo: PrismaLeadRepository;
  let prisma: PrismaService;
  const tenantId = randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, { provide: LeadRepository, useClass: PrismaLeadRepository }],
    }).compile();

    prisma = moduleFixture.get(PrismaService);
    repo = moduleFixture.get(LeadRepository) as PrismaLeadRepository;
  });

  beforeEach(async () => {
    await prisma.lead.deleteMany({ where: { tenantId } });
  });

  it('deve salvar e recuperar lead por ID', async () => {
    const lead = LeadEntity.create({
      tenantId, name: 'Teste', email: 'teste@empresa.com', source: 'MANUAL' as any,
    });
    await repo.save(lead);
    const found = await repo.findById(lead.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Teste');
  });

  it('deve retornar null para ID inexistente', async () => {
    const found = await repo.findById(randomUUID());
    expect(found).toBeNull();
  });

  it('deve atualizar lead existente', async () => {
    const lead = LeadEntity.create({
      tenantId, name: 'Original', email: 'original@empresa.com', source: 'MANUAL' as any,
    });
    await repo.save(lead);

    lead.qualify(85);
    await repo.save(lead);

    const updated = await repo.findById(lead.id);
    expect(updated!.status).toBe(LeadStatus.QUALIFIED);
    expect(updated!.score).toBe(85);
  });

  it('deve aplicar filtros na busca', async () => {
    const lead1 = LeadEntity.create({
      tenantId, name: 'Ativo', email: 'ativo@empresa.com', source: 'MANUAL' as any,
    });
    const lead2 = LeadEntity.create({
      tenantId, name: 'Qualificado', email: 'qualificado@empresa.com', source: 'MANUAL' as any,
    });
    lead2.qualify(80);
    await repo.save(lead1);
    await repo.save(lead2);

    const results = await repo.findMany({
      tenantId, status: [LeadStatus.QUALIFIED], page: 1, limit: 10,
    });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Qualificado');
  });

  it('deve aplicar soft delete', async () => {
    const lead = LeadEntity.create({
      tenantId, name: 'Deletar', email: 'deletar@empresa.com', source: 'MANUAL' as any,
    });
    await repo.save(lead);
    await repo.softDelete(lead.id);

    const found = await repo.findById(lead.id);
    expect(found).toBeNull();

    const all = await repo.findMany({ tenantId, page: 1, limit: 10 });
    expect(all.length).toBe(0);
  });

  it('deve verificar email duplicado', async () => {
    const email = 'dup@empresa.com';
    const lead = LeadEntity.create({
      tenantId, name: 'Dup', email, source: 'IMPORT' as any,
    });
    await repo.save(lead);

    const existing = await repo.findByEmail(email, tenantId);
    expect(existing).toBeDefined();
    expect(existing!.email).toBe(email);
  });

  it('deve retornar null se email não existe', async () => {
    const existing = await repo.findByEmail('naoexiste@empresa.com', tenantId);
    expect(existing).toBeNull();
  });
});
