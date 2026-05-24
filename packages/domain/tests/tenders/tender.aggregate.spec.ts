import { Tender, TenderProps } from '../../src/tenders/tender.aggregate';
import { TenderItem, TenderItemProps } from '../../src/tenders/entities/tender-item.entity';
import { TenderDocument, TenderDocumentProps, DocumentStatus } from '../../src/tenders/entities/tender-document.entity';
import { ChecklistRequirement, TenderDocumentType } from '../../src/tenders/value-objects/checklist-requirement.vo';
import { BidAmount } from '../../src/value-objects/bid-amount.vo';
import { BusinessRuleException, TenantMismatchException } from '../../src/exceptions';

describe('Tender Aggregate & Value Objects', () => {
  const defaultTenantId = 'tenant-123';
  let defaultProps: TenderProps;

  beforeEach(() => {
    defaultProps = {
      id: 'tender-1',
      tenantId: defaultTenantId,
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Gov',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Aquisição de Laptops',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-1',
    };
  });

  describe('Tender', () => {
    it('deve criar uma licitação com sucesso quando as props são válidas', () => {
      const tender = new Tender(defaultProps);
      expect(tender.id).toBe('tender-1');
      expect(tender.tenantId).toBe(defaultTenantId);
      expect(tender.status).toBe('CAPTURED');
    });

    it('deve lançar erro de domínio se closingDate for antes ou igual a openingDate', () => {
      const invalidProps = {
        ...defaultProps,
        closingDate: new Date('2026-04-01'), // antes do openingDate
      };
      expect(() => new Tender(invalidProps)).toThrow(BusinessRuleException);
      expect(() => new Tender(invalidProps)).toThrow('closingDate must be after openingDate');
    });

    it('deve impedir adicionar itens se a licitação já estiver SUBMITTED ou DISPUTE', () => {
      const tender = new Tender({ ...defaultProps, status: 'SUBMITTED' });
      const itemProps: TenderItemProps = {
        id: 'item-1',
        tenantId: defaultTenantId,
        tenderId: 'tender-1',
        number: 1,
        description: 'Laptop',
        quantity: 10,
        unit: 'UN',
      };
      const item = new TenderItem(itemProps);

      expect(() => tender.addItem(item, defaultTenantId)).toThrow(BusinessRuleException);
      expect(() => tender.addItem(item, defaultTenantId)).toThrow('Cannot modify items when tender is submitted or in dispute');
    });

    it('deve bloquear adicionar um item se o tenantId do item não for o mesmo', () => {
      const tender = new Tender(defaultProps);
      const itemProps: TenderItemProps = {
        id: 'item-1',
        tenantId: 'tenant-999',
        tenderId: 'tender-1',
        number: 1,
        description: 'Laptop',
        quantity: 10,
        unit: 'UN',
      };
      const item = new TenderItem(itemProps);

      expect(() => tender.addItem(item, defaultTenantId)).toThrow(TenantMismatchException);
    });

    it('deve bloquear a execução de métodos em lote se o tenantId que faz a requisição for divergente', () => {
      const tender = new Tender(defaultProps);
      const itemProps: TenderItemProps = {
        id: 'item-1',
        tenantId: defaultTenantId,
        tenderId: 'tender-1',
        number: 1,
        description: 'Laptop',
        quantity: 10,
        unit: 'UN',
      };
      const item = new TenderItem(itemProps);

      expect(() => tender.addItem(item, 'hacker-tenant-404')).toThrow(TenantMismatchException);
    });

    describe('closeAndEvaluateResult', () => {
      it('deve rejeitar fechamento a partir de status inválidos', () => {
        const tender = new Tender({ ...defaultProps, status: 'CAPTURED' });
        
        expect(() => tender.closeAndEvaluateResult(defaultTenantId, {
          status: 'WON',
          classification: 1,
          winnerValue: 50000,
          winnerName: 'Nossa Empresa',
          winnerDocument: '12.345.678/0001-90'
        })).toThrow(BusinessRuleException);
        expect(() => tender.closeAndEvaluateResult(defaultTenantId, {
          status: 'WON',
          classification: 1,
          winnerValue: 50000,
          winnerName: 'Nossa Empresa',
          winnerDocument: '12.345.678/0001-90'
        })).toThrow('Can only evaluate result for tenders in DISPUTE or RESULT_AWAITED or SUBMITTED status');
      });

      it('deve rejeitar transições para status de resultado inválidos', () => {
        const tender = new Tender({ ...defaultProps, status: 'DISPUTE' });
        
        expect(() => tender.closeAndEvaluateResult(defaultTenantId, {
          status: 'CAPTURED' as any,
          classification: 1,
          winnerValue: 50000,
          winnerName: 'Nossa Empresa',
          winnerDocument: '12.345.678/0001-90'
        })).toThrow(BusinessRuleException);
        expect(() => tender.closeAndEvaluateResult(defaultTenantId, {
          status: 'CAPTURED' as any,
          classification: 1,
          winnerValue: 50000,
          winnerName: 'Nossa Empresa',
          winnerDocument: '12.345.678/0001-90'
        })).toThrow('Invalid result status. Must be WON, LOST, APPEAL or DISQUALIFIED');
      });

      it('deve processar o resultado com sucesso, validar a regra de vitória (WON) e injetar metadados', () => {
        const tender = new Tender({ ...defaultProps, status: 'DISPUTE' });
        
        const itemProps: TenderItemProps = {
          id: 'item-1',
          tenantId: defaultTenantId,
          tenderId: 'tender-1',
          number: 1,
          description: 'Laptop',
          quantity: 10,
          unit: 'UN',
        };
        tender.addItem(new TenderItem(itemProps), defaultTenantId);

        tender.closeAndEvaluateResult(defaultTenantId, {
          status: 'WON',
          classification: 1,
          winnerValue: 49000,
          winnerName: 'Nossa Empresa SA',
          winnerDocument: '12.345.678/0001-90',
          rankings: [{ position: 1, name: 'Nossa Empresa SA' }, { position: 2, name: 'Concorrente' }]
        });

        expect(tender.status).toBe('WON');
        expect(tender.metadata.result).toBeDefined();
        expect(tender.metadata.result.classification).toBe(1);
        expect(tender.metadata.result.winnerName).toBe('Nossa Empresa SA');
        expect(tender.metadata.result.rankings.length).toBe(2);
        
        // As it's WON, items should be marked as winners in the aggregate scope
        expect((tender.items[0] as any).winner).toBe(true);
      });
    });

    describe('submitProposal', () => {
      it('deve transitar o status para SUBMITTED e injetar os dados comerciais no metadata', () => {
        const tender = new Tender(defaultProps);
        
        // Adiciona um item para receber valor da proposta
        const itemProps: TenderItemProps = {
          id: 'item-1',
          tenantId: defaultTenantId,
          tenderId: 'tender-1',
          number: 1,
          description: 'Laptop',
          quantity: 10,
          unit: 'UN',
        };
        tender.addItem(new TenderItem(itemProps), defaultTenantId);

        const proposalData = {
          totalValue: 50000,
          discountPercent: 5,
          itemValues: { '1': 5000 },
          technicalProposal: 'Proposta Técnica XPTO',
          commercialTerms: 'Pagamento em 30 dias',
        };

        tender.submitProposal(defaultTenantId, proposalData);

        expect(tender.status).toBe('SUBMITTED');
        expect(tender.metadata.proposal).toBeDefined();
        expect(tender.metadata.proposal.totalValue).toBe(50000);
        expect(tender.metadata.proposal.commercialTerms).toBe('Pagamento em 30 dias');
        
        // Verifica se o valor foi injetado no item
        expect(tender.items[0].proposalValue).toBe(5000);
      });

      it('deve bloquear submissão caso o tender já esteja SUBMITTED', () => {
        const tender = new Tender({ ...defaultProps, status: 'SUBMITTED' });
        
        expect(() => tender.submitProposal(defaultTenantId, { totalValue: 100 })).toThrow(BusinessRuleException);
        expect(() => tender.submitProposal(defaultTenantId, { totalValue: 100 })).toThrow('Cannot submit proposal for a tender in this status');
      });

      it('deve garantir que o Aggregate congele itens no status SUBMITTED', () => {
        const tender = new Tender({ ...defaultProps, status: 'SUBMITTED' });
        
        const itemProps: TenderItemProps = {
          id: 'item-1',
          tenantId: defaultTenantId,
          tenderId: 'tender-1',
          number: 1,
          description: 'Laptop',
          quantity: 10,
          unit: 'UN',
        };

        expect(() => tender.addItem(new TenderItem(itemProps), defaultTenantId)).toThrow(BusinessRuleException);
        expect(() => tender.removeItem(1, defaultTenantId)).toThrow(BusinessRuleException);
      });
    });

    describe('Compliance Scanner (isFullyCompliant)', () => {
      it('deve retornar true se a licitação não possuir checklist', () => {
        const tender = new Tender(defaultProps);
        expect(tender.isFullyCompliant()).toBe(true);
      });

      it('deve retornar false se houver requisitos obrigatórios pendentes de upload', () => {
        const tender = new Tender(defaultProps);
        
        const req1 = new ChecklistRequirement({ documentType: TenderDocumentType.LEGAL, isRequired: true, description: 'CNPJ' });
        const req2 = new ChecklistRequirement({ documentType: TenderDocumentType.FISCAL_LABOR, isRequired: false, description: 'FGTS' });
        
        tender.addRequiredChecklist([req1, req2], defaultTenantId);

        expect(tender.isFullyCompliant()).toBe(false);
      });

      it('deve retornar true apenas quando todos os documentos obrigatórios estiverem VÁLIDOS ou UPLOADED e não expirados', () => {
        const tender = new Tender(defaultProps);
        
        const req1 = new ChecklistRequirement({ documentType: TenderDocumentType.LEGAL, isRequired: true, description: 'CNPJ' });
        tender.addRequiredChecklist([req1], defaultTenantId);

        const doc = new TenderDocument({
          id: 'doc-1',
          tenderId: 'tender-1',
          tenantId: defaultTenantId,
          type: TenderDocumentType.LEGAL,
          title: 'CNPJ',
          status: DocumentStatus.UPLOADED,
          expiresAt: new Date(Date.now() + 86400000) // Future
        });
        
        tender.attachDocument(doc);
        expect(tender.isFullyCompliant()).toBe(true);

        doc.validateDocument('user-1');
        expect(tender.isFullyCompliant()).toBe(true);

        // Expirando documento
        doc.markAsExpired();
        expect(tender.isFullyCompliant()).toBe(false);
      });
    });
  });

  describe('TenderItem Entity', () => {
    it('deve encapsular e aceitar o assignProposalValue corretamente', () => {
      const itemProps: TenderItemProps = {
        id: 'item-1',
        tenantId: defaultTenantId,
        tenderId: 'tender-1',
        number: 1,
        description: 'Laptop',
        quantity: 10,
        unit: 'UN',
      };
      const item = new TenderItem(itemProps);

      item.assignProposalValue(5000);
      expect(item.proposalValue).toBe(5000);
    });

    it('deve lançar exceção se assignProposalValue for negativo', () => {
      const itemProps: TenderItemProps = {
        id: 'item-1',
        tenantId: defaultTenantId,
        tenderId: 'tender-1',
        number: 1,
        description: 'Laptop',
        quantity: 10,
        unit: 'UN',
      };
      const item = new TenderItem(itemProps);

      expect(() => item.assignProposalValue(-100)).toThrow(BusinessRuleException);
      expect(() => item.assignProposalValue(-100)).toThrow('Proposal value cannot be negative');
    });
  });

  describe('TenderDocument Entity', () => {
    it('deve bloquear upload caso o documento já esteja VALIDATED', () => {
      const doc = new TenderDocument({
        id: 'doc-1',
        tenderId: 'tender-1',
        tenantId: defaultTenantId,
        type: TenderDocumentType.LEGAL,
        title: 'CNPJ',
        status: DocumentStatus.VALIDATED,
      });

      expect(() => doc.uploadFile('http://new.url', new Date())).toThrowError('Cannot upload file to a validated document');
    });

    it('deve registrar corretamente o motivo da invalidação nos metadados', () => {
      const doc = new TenderDocument({
        id: 'doc-1',
        tenderId: 'tender-1',
        tenantId: defaultTenantId,
        type: TenderDocumentType.LEGAL,
        title: 'CNPJ',
        status: DocumentStatus.UPLOADED,
        fileUrl: 'http://my.file',
      });

      doc.invalidate('Documento ilegível', 'user-123');

      expect(doc.status).toBe(DocumentStatus.PENDING);
      expect(doc.fileUrl).toBeNull();
      expect(doc.metadata.invalidatedBy).toBe('user-123');
      expect(doc.metadata.invalidationReason).toBe('Documento ilegível');
    });
  });

  describe('BidAmount Value Object', () => {
    it('deve criar um valor de lance válido', () => {
      const bid = new BidAmount(100.5, 'BRL');
      expect(bid.amount).toBe(100.5);
      expect(bid.currency).toBe('BRL');
    });

    it('deve bloquear instâncias com valor negativo', () => {
      expect(() => new BidAmount(-50, 'BRL')).toThrow(BusinessRuleException);
      expect(() => new BidAmount(-50, 'BRL')).toThrow('Amount cannot be negative');
    });

    it('deve validar corretamente se atende ao decremento mínimo em relação ao valor anterior', () => {
      const previousBid = new BidAmount(1000, 'BRL');
      const minDecrement = new BidAmount(50, 'BRL');

      const validNewBid = new BidAmount(900, 'BRL');
      expect(validNewBid.isValidDecrement(previousBid, minDecrement)).toBe(true);

      const invalidNewBid = new BidAmount(980, 'BRL');
      expect(invalidNewBid.isValidDecrement(previousBid, minDecrement)).toBe(false);
    });
  });

  describe('TenderDispute Entity', () => {
    const disputeProps = {
      id: 'dispute-1',
      tenantId: 'tenant-123',
      tenderId: 'tender-1',
      status: 'OPEN' as const,
      startPrice: 10000,
      currentPrice: 10000,
      minDecrement: 100,
      extensionTime: 180,
      startedAt: new Date(),
      closedAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    };

    describe('registerBid', () => {
      it('deve registrar lance válido e abater o valor corretamente', () => {
        const { TenderDispute } = require('../../src/tenders/entities/tender-dispute.entity');
        const dispute = new TenderDispute(disputeProps);
        
        dispute.registerBid('bid-1', 'supp-1', 9500);
        
        expect(dispute.bids.length).toBe(1);
        expect(dispute.currentPrice.amount).toBe(9500);
        expect(dispute.totalBids).toBe(1);
      });

      it('deve bloquear lance se o status não for OPEN ou EXTENDED', () => {
        const { TenderDispute } = require('../../src/tenders/entities/tender-dispute.entity');
        
        const scheduledDispute = new TenderDispute({ ...disputeProps, status: 'SCHEDULED' });
        expect(() => scheduledDispute.registerBid('bid-1', 'supp-1', 9500)).toThrow(BusinessRuleException);
        
        const closedDispute = new TenderDispute({ ...disputeProps, status: 'CLOSED', closedAt: new Date() });
        expect(() => closedDispute.registerBid('bid-1', 'supp-1', 9500)).toThrow(BusinessRuleException);
      });

      it('deve rejeitar o lance se o decremento mínimo não for respeitado', () => {
        const { TenderDispute } = require('../../src/tenders/entities/tender-dispute.entity');
        const dispute = new TenderDispute(disputeProps); // currentPrice: 10000, minDecrement: 100
        
        // Lance de 9950 (decremento de apenas 50)
        expect(() => dispute.registerBid('bid-1', 'supp-1', 9950)).toThrow(BusinessRuleException);
        expect(() => dispute.registerBid('bid-1', 'supp-1', 9950)).toThrow('Bid is below the minimum decrement allowed');
      });
    });

    describe('extend', () => {
      it('deve estender matematicamente o horário de fechamento, alterar o status para EXTENDED e incrementar extensões', () => {
        const { TenderDispute } = require('../../src/tenders/entities/tender-dispute.entity');
        
        const baseTime = new Date('2026-05-22T10:00:00Z');
        const dispute = new TenderDispute({
          ...disputeProps,
          status: 'OPEN',
          closedAt: baseTime,
          extensionTime: 180, // 3 minutes
          extensions: 0
        });

        dispute.extend();

        expect(dispute.status).toBe('EXTENDED');
        expect(dispute.extensions).toBe(1);
        
        // Deve ter adicionado 180 segundos (3 minutos)
        const expectedTime = new Date('2026-05-22T10:03:00Z');
        expect(dispute.closedAt).toBeDefined();
        expect(dispute.closedAt?.getTime()).toBe(expectedTime.getTime());
      });
    });
  });
});
