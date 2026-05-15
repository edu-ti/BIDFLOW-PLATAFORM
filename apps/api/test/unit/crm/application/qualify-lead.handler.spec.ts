import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { QualifyLeadCommand } from '../../../../../src/crm/application/lead/commands/qualify-lead/qualify-lead.command';
import { QualifyLeadHandler } from '../../../../../src/crm/application/lead/commands/qualify-lead/qualify-lead.handler';
import { LeadRepository } from '../../../../../src/crm/domain/lead/lead.repository';
import { LeadEntity } from '../../../../../src/crm/domain/lead/lead.entity';
import { LeadStatus } from '../../../../../src/crm/domain/common/enums/lead-status.enum';

describe('QualifyLeadHandler — Application', () => {
  let handler: QualifyLeadHandler;
  let leadRepo: jest.Mocked<LeadRepository>;

  const tenantId = randomUUID();
  const leadId = randomUUID();

  beforeEach(async () => {
    leadRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      findDuplicates: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        QualifyLeadHandler,
        { provide: LeadRepository, useValue: leadRepo },
        { provide: 'LeadEventPublisher', useValue: { publishLeadQualified: jest.fn() } },
      ],
    }).compile();

    handler = module.get(QualifyLeadHandler);
  });

  it('deve qualificar lead existente', async () => {
    const lead = LeadEntity.create({
      tenantId, name: 'Carlos', email: 'carlos@empresa.com', source: 'MANUAL' as any,
    });
    Reflect.set(lead, 'id', leadId);
    leadRepo.findById.mockResolvedValue(lead);

    const result = await handler.execute(new QualifyLeadCommand({
      leadId, tenantId, score: 85,
    }));

    expect(result.status).toBe(LeadStatus.QUALIFIED);
    expect(leadRepo.save).toHaveBeenCalled();
  });

  it('deve lançar erro se lead não existir', async () => {
    leadRepo.findById.mockResolvedValue(null);
    await expect(handler.execute(new QualifyLeadCommand({
      leadId, tenantId, score: 85,
    }))).rejects.toThrow('Lead not found');
  });

  it('deve lançar erro se lead já convertido', async () => {
    const lead = LeadEntity.create({
      tenantId, name: 'Carlos', email: 'carlos@empresa.com', source: 'MANUAL' as any,
    });
    Reflect.set(lead, 'id', leadId);
    Reflect.set(lead, 'status', LeadStatus.CONVERTED);
    leadRepo.findById.mockResolvedValue(lead);

    await expect(handler.execute(new QualifyLeadCommand({
      leadId, tenantId, score: 85,
    }))).rejects.toThrow();
  });
});
