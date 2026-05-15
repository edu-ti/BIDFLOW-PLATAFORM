import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CreateLeadCommand } from '../../../../../src/crm/application/lead/commands/create-lead/create-lead.command';
import { CreateLeadHandler } from '../../../../../src/crm/application/lead/commands/create-lead/create-lead.handler';
import { LeadRepository } from '../../../../../src/crm/domain/lead/lead.repository';
import { TimelineEntryRepository } from '../../../../../src/crm/domain/timeline/timeline-entry.repository';
import { LeadEntity } from '../../../../../src/crm/domain/lead/lead.entity';

describe('CreateLeadHandler — Application', () => {
  let handler: CreateLeadHandler;
  let leadRepo: jest.Mocked<LeadRepository>;
  let timelineRepo: jest.Mocked<TimelineEntryRepository>;

  const tenantId = randomUUID();
  const command = new CreateLeadCommand({
    tenantId,
    name: 'Carlos Almeida',
    email: 'carlos@empresa.com.br',
    source: 'INDICATION',
    company: 'Empresa Exemplo',
  });

  beforeEach(async () => {
    leadRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findMany: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      findDuplicates: jest.fn(),
    };

    timelineRepo = {
      save: jest.fn(),
      findByLead: jest.fn(),
      findByCustomer: jest.fn(),
      findByOpportunity: jest.fn(),
      createMany: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CreateLeadHandler,
        { provide: LeadRepository, useValue: leadRepo },
        { provide: TimelineEntryRepository, useValue: timelineRepo },
        { provide: 'LeadEventPublisher', useValue: { publishLeadCaptured: jest.fn() } },
      ],
    }).compile();

    handler = module.get(CreateLeadHandler);
  });

  it('deve criar lead com sucesso', async () => {
    const result = await handler.execute(command);
    expect(leadRepo.save).toHaveBeenCalled();
    expect(timelineRepo.save).toHaveBeenCalled();
    expect(result.name).toBe('Carlos Almeida');
    expect(result.status).toBe('NEW');
  });

  it('deve rejeitar email duplicado', async () => {
    leadRepo.findByEmail.mockResolvedValueOnce({ id: randomUUID() } as LeadEntity);
    await expect(handler.execute(command)).rejects.toThrow('Email already exists');
    expect(leadRepo.save).not.toHaveBeenCalled();
  });

  it('deve criar entrada de timeline ao criar lead', async () => {
    await handler.execute(command);
    expect(timelineRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SYSTEM_EVENT' })
    );
  });
});
