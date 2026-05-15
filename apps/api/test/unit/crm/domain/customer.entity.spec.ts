import { randomUUID } from 'crypto';
import { CustomerEntity } from '../../../../../src/crm/domain/customer/customer.entity';
import { CustomerTier } from '../../../../../src/crm/domain/common/enums/customer-tier.enum';
import { CustomerSegment } from '../../../../../src/crm/domain/common/enums/customer-segment.enum';

describe('CustomerEntity — Domain', () => {
  const tenantId = randomUUID();

  const validProps = () => ({
    tenantId,
    legalName: 'Empresa Exemplo Ltda',
    taxId: '12.345.678/0001-90',
    email: 'contato@empresa.com.br',
    segment: CustomerSegment.PRIVATE,
    tier: CustomerTier.BRONZE,
  });

  describe('create()', () => {
    it('deve criar cliente com status ACTIVE', () => {
      const c = CustomerEntity.create(validProps());
      expect(c.status).toBe('ACTIVE');
      expect(c.tier).toBe(CustomerTier.BRONZE);
      expect(c.totalRevenue).toBe(0);
    });

    it('deve rejeitar taxId vazio', () => {
      expect(() => CustomerEntity.create({ ...validProps(), taxId: '' }))
        .toThrow('TaxId is required');
    });

    it('deve rejeitar email inválido', () => {
      expect(() => CustomerEntity.create({ ...validProps(), email: 'invalido' }))
        .toThrow('Invalid email');
    });
  });

  describe('changeTier()', () => {
    it('deve alterar tier e registrar data', () => {
      const c = CustomerEntity.create(validProps());
      c.changeTier(CustomerTier.GOLD, 'REVENUE', adminUserId);
      expect(c.tier).toBe(CustomerTier.GOLD);
      expect(c.tierChangedAt).toBeDefined();
    });

    it('não deve alterar se tier for o mesmo', () => {
      const c = CustomerEntity.create(validProps());
      c.changeTier(CustomerTier.BRONZE, 'MANUAL', adminUserId);
      expect(c.tierChangedAt).toBeUndefined();
    });

    it('deve disparar CustomerTierChangedEvent', () => {
      const c = CustomerEntity.create(validProps());
      c.changeTier(CustomerTier.GOLD, 'REVENUE', adminUserId);
      const events = c.getDomainEvents();
      expect(events.some(e => e.type === 'com.bidflow.crm.customer.tier_changed.v1')).toBe(true);
    });
  });

  describe('softDelete()', () => {
    it('deve marcar deletedAt', () => {
      const c = CustomerEntity.create(validProps());
      c.softDelete();
      expect(c.deletedAt).toBeDefined();
    });
  });

  describe('addRevenue()', () => {
    it('deve acumular receita e incrementar oportunidades ganhas', () => {
      const c = CustomerEntity.create(validProps());
      c.addRevenue(50000);
      expect(c.totalRevenue).toBe(50000);
      expect(c.wonOpportunities).toBe(1);
      c.addRevenue(30000);
      expect(c.totalRevenue).toBe(80000);
      expect(c.wonOpportunities).toBe(2);
    });
  });
});

const adminUserId = randomUUID();
