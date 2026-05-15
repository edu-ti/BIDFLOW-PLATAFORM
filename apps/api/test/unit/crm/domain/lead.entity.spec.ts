import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { LeadEntity } from '../../../../src/crm/domain/lead/lead.entity';
import { LeadStatus } from '../../../../src/crm/domain/common/enums/lead-status.enum';
import { LeadSource } from '../../../../src/crm/domain/common/enums/lead-source.enum';
import { InvalidLeadStatusError } from '../../../../src/crm/domain/common/errors/invalid-lead-status.error';
import { LeadAlreadyConvertedError } from '../../../../src/crm/domain/common/errors/lead-already-converted.error';

describe('LeadEntity — Domain', () => {
  const tenantId = randomUUID();
  const validProps = () => ({
    tenantId,
    name: 'Carlos Almeida',
    email: 'carlos@empresa.com.br',
    source: LeadSource.INDICATION,
  });

  describe('create()', () => {
    it('deve criar lead com status NEW e score 0', () => {
      const lead = LeadEntity.create(validProps());
      expect(lead.status).toBe(LeadStatus.NEW);
      expect(lead.score).toBe(0);
      expect(lead.id).toBeDefined();
    });

    it('deve rejeitar email inválido', () => {
      expect(() => LeadEntity.create({ ...validProps(), email: 'invalido' }))
        .toThrow('Invalid email');
    });

    it('deve rejeitar name vazio', () => {
      expect(() => LeadEntity.create({ ...validProps(), name: '' }))
        .toThrow('Name is required');
    });

    it('deve aceitar campos opcionais', () => {
      const lead = LeadEntity.create({
        ...validProps(),
        company: 'Empresa X',
        phone: '+5511999998888',
        tags: ['hot', 'gov'],
      });
      expect(lead.company).toBe('Empresa X');
      expect(lead.tags).toEqual(['hot', 'gov']);
    });
  });

  describe('qualify()', () => {
    it('deve qualificar lead NEW para QUALIFIED', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(85, { profileFit: 90, engagement: 80 });
      expect(lead.status).toBe(LeadStatus.QUALIFIED);
      expect(lead.score).toBe(85);
    });

    it('deve qualificar lead CONTACTED para QUALIFIED', () => {
      const lead = LeadEntity.create(validProps());
      lead.markContacted(userId);
      lead.qualify(70);
      expect(lead.status).toBe(LeadStatus.QUALIFIED);
    });

    it('deve rejeitar qualificar lead CONVERTED', () => {
      const lead = LeadEntity.create(validProps());
      Reflect.set(lead, 'status', LeadStatus.CONVERTED);
      expect(() => lead.qualify(80)).toThrow(InvalidLeadStatusError);
    });

    it('deve rejeitar score fora do intervalo 0-100', () => {
      const lead = LeadEntity.create(validProps());
      expect(() => lead.qualify(150)).toThrow('Score must be between 0 and 100');
      expect(() => lead.qualify(-1)).toThrow('Score must be between 0 and 100');
    });

    it('deve disparar LeadQualifiedEvent ao qualificar', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(85);
      const events = lead.getDomainEvents();
      expect(events.some(e => e.type === 'com.bidflow.crm.lead.qualified.v1')).toBe(true);
    });
  });

  describe('disqualify()', () => {
    it('deve desqualificar lead com motivo', () => {
      const lead = LeadEntity.create(validProps());
      lead.disqualify('BUDGET_TOO_LOW');
      expect(lead.status).toBe(LeadStatus.DISQUALIFIED);
      expect(lead.disqualificationReason).toBe('BUDGET_TOO_LOW');
    });

    it('deve rejeitar desqualificar lead CONVERTED', () => {
      const lead = LeadEntity.create(validProps());
      Reflect.set(lead, 'status', LeadStatus.CONVERTED);
      expect(() => lead.disqualify('DUPLICATE')).toThrow(LeadAlreadyConvertedError);
    });

    it('deve exigir motivo para desqualificação', () => {
      const lead = LeadEntity.create(validProps());
      expect(() => lead.disqualify('')).toThrow('Disqualification reason is required');
    });
  });

  describe('convert()', () => {
    it('deve converter lead QUALIFIED para CONVERTED', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(80);
      const customerId = randomUUID();
      lead.convert(customerId, userId);
      expect(lead.status).toBe(LeadStatus.CONVERTED);
      expect(lead.convertedToCustomerId).toBe(customerId);
      expect(lead.convertedBy).toBe(userId);
    });

    it('deve rejeitar converter lead sem qualificar', () => {
      const lead = LeadEntity.create(validProps());
      expect(() => lead.convert(randomUUID(), userId)).toThrow(InvalidLeadStatusError);
    });

    it('deve rejeitar converter lead já convertido', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(80);
      lead.convert(randomUUID(), userId);
      expect(() => lead.convert(randomUUID(), userId)).toThrow(LeadAlreadyConvertedError);
    });
  });

  describe('softDelete()', () => {
    it('deve marcar deletedAt', () => {
      const lead = LeadEntity.create(validProps());
      lead.softDelete();
      expect(lead.deletedAt).toBeDefined();
    });

    it('deve rejeitar soft delete de lead convertido sem autorização', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(80);
      lead.convert(randomUUID(), userId);
      expect(() => lead.softDelete()).toThrow('Cannot delete converted lead');
    });
  });

  describe('assignTo()', () => {
    it('deve atribuir usuário responsável', () => {
      const lead = LeadEntity.create(validProps());
      const ownerId = randomUUID();
      lead.assignTo(ownerId);
      expect(lead.assignedTo).toBe(ownerId);
      expect(lead.assignedAt).toBeDefined();
    });

    it('deve rejeitar atribuição para lead CONVERTED', () => {
      const lead = LeadEntity.create(validProps());
      lead.qualify(80);
      lead.convert(randomUUID(), userId);
      expect(() => lead.assignTo(randomUUID())).toThrow(LeadAlreadyConvertedError);
    });
  });

  describe('addTag() / removeTag()', () => {
    it('deve adicionar e remover tags', () => {
      const lead = LeadEntity.create(validProps());
      lead.addTag('vip');
      expect(lead.tags).toContain('vip');
      lead.addTag('vip');
      expect(lead.tags.filter(t => t === 'vip').length).toBe(1);
      lead.removeTag('vip');
      expect(lead.tags).not.toContain('vip');
    });
  });

  describe('restore() — factory para reconstituição', () => {
    it('deve reconstituir lead a partir de dados persistidos', () => {
      const id = randomUUID();
      const lead = LeadEntity.restore({
        id,
        tenantId,
        name: 'João',
        email: 'joao@empresa.com',
        status: LeadStatus.QUALIFIED,
        score: 80,
        createdAt: new Date('2026-01-01'),
      });
      expect(lead.id).toBe(id);
      expect(lead.status).toBe(LeadStatus.QUALIFIED);
      expect(lead.createdAt).toEqual(new Date('2026-01-01'));
    });
  });

  describe('toPersistence()', () => {
    it('deve serializar para formato Prisma', () => {
      const lead = LeadEntity.create(validProps());
      const data = lead.toPersistence();
      expect(data.name).toBe('Carlos Almeida');
      expect(data.status).toBe('NEW');
      expect(data.id).toBeDefined();
    });
  });
});
