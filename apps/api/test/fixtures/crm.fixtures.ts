import { randomUUID } from 'crypto';

export const tenantAId = randomUUID();
export const tenantBId = randomUUID();
export const userId = randomUUID();
export const adminUserId = randomUUID();

export const makeLeadFixture = (overrides = {}) => ({
  id: randomUUID(),
  tenantId: tenantAId,
  name: 'Carlos Almeida',
  email: 'carlos@empresa.com.br',
  phone: '+5511999998888',
  company: 'Empresa Exemplo Ltda',
  position: 'Diretor de Compras',
  source: 'INDICATION',
  status: 'NEW',
  score: 0,
  tags: ['hot', 'enterprise'],
  notes: 'Lead de alto potencial',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makeCustomerFixture = (overrides = {}) => ({
  id: randomUUID(),
  tenantId: tenantAId,
  legalName: 'Empresa Exemplo Ltda',
  fantasyName: 'Exemplo',
  taxId: '12.345.678/0001-90',
  email: 'contato@empresa.com.br',
  segment: 'PRIVATE',
  tier: 'SILVER',
  status: 'ACTIVE',
  totalRevenue: 0,
  wonOpportunities: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makePipelineFixture = (overrides = {}) => ({
  id: randomUUID(),
  tenantId: tenantAId,
  name: 'Vendas Diretas',
  slug: 'vendas-diretas',
  isDefault: true,
  isActive: true,
  stages: [
    { id: 'prospecting', name: 'Prospecção', order: 1, probability: 10, color: '#e8f5e9' },
    { id: 'qualification', name: 'Qualificação', order: 2, probability: 25, color: '#c8e6c9' },
    { id: 'proposal', name: 'Proposta', order: 3, probability: 50, color: '#a5d6a7' },
    { id: 'negotiation', name: 'Negociação', order: 4, probability: 75, color: '#81c784' },
    { id: 'closing', name: 'Fechamento', order: 5, probability: 90, color: '#66bb6a' },
  ],
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makeOpportunityFixture = (pipelineId: string, overrides = {}) => ({
  id: randomUUID(),
  tenantId: tenantAId,
  pipelineId,
  title: 'Fornecimento de Equipamentos de TI',
  status: 'OPEN',
  stage: 'qualification',
  stageOrder: 2,
  estimatedValue: 750000.0,
  currency: 'BRL',
  probability: 25,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makeTaskFixture = (overrides = {}) => ({
  id: randomUUID(),
  tenantId: tenantAId,
  title: 'Enviar proposta comercial',
  status: 'PENDING',
  priority: 'HIGH',
  assignedTo: userId,
  assignedBy: adminUserId,
  dueDate: new Date(Date.now() + 86400000),
  isRecurring: false,
  reminderSent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
