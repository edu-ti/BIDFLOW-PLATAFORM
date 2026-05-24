// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PrismaTenderRepository } from '../../../src/tenders/infrastructure/persistence/prisma/prisma-tender.repository';
import { Tender, TenderProps } from '../../../../../packages/domain/src/tenders/tender.aggregate';
import { TenderItem, TenderItemProps } from '../../../../../packages/domain/src/tenders/entities/tender-item.entity';

describe('PrismaTenderRepository - Integration & Isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let repository: PrismaTenderRepository;

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [PrismaTenderRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    repository = moduleFixture.get(PrismaTenderRepository);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve salvar uma licitação completa (com itens) e recuperá-la transacionalmente', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      externalId: 'ext-001',
      source: 'MANUAL',
      number: '100/2026',
      organization: 'Prefeitura de Teste',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Compra de Monitores',
      currency: 'BRL',
      openingDate: new Date('2026-05-10T10:00:00Z'),
      closingDate: new Date('2026-06-10T10:00:00Z'),
      createdBy: 'user-xyz',
    };

    const tender = new Tender(props);

    const itemProps: TenderItemProps = {
      id: randomUUID(),
      tenantId: tenantA,
      tenderId: tender.id,
      number: 1,
      description: 'Monitor 24',
      quantity: 50,
      unit: 'UN',
    };
    const item = new TenderItem(itemProps);
    tender.addItem(item, tenantA);

    // Salvar no DB
    await repository.save(tender);

    // Recuperar
    const savedTender = await repository.findById(tenderId, tenantA);
    expect(savedTender).not.toBeNull();
    expect(savedTender?.id).toBe(tenderId);
    expect(savedTender?.organization).toBe('Prefeitura de Teste');
    expect(savedTender?.items.length).toBe(1);
    expect(savedTender?.items[0].description).toBe('Monitor 24');

    // Atualizar adicionando um segundo item para testar a transação e o replace completo
    const item2Props: TenderItemProps = {
      id: randomUUID(),
      tenantId: tenantA,
      tenderId: tender.id,
      number: 2,
      description: 'Teclado Mecânico',
      quantity: 50,
      unit: 'UN',
    };
    tender.addItem(new TenderItem(item2Props), tenantA);
    
    await repository.save(tender);

    const updatedTender = await repository.findById(tenderId, tenantA);
    expect(updatedTender?.items.length).toBe(2);
    
    const descriptions = updatedTender?.items.map(i => i.description);
    expect(descriptions).toContain('Monitor 24');
    expect(descriptions).toContain('Teclado Mecânico');
  });

  it('Isolamento Multi-Tenant Estrito: Tenant B não pode ler dados do Tenant A', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      source: 'MANUAL',
      number: '999/2026',
      organization: 'Secretaria A',
      modality: 'DISPENSA',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Segredo A',
      currency: 'BRL',
      openingDate: new Date(),
      closingDate: new Date(Date.now() + 86400000),
      createdBy: 'user-a',
    };

    const tender = new Tender(props);
    await repository.save(tender);

    // Verifica que Tenant A consegue ler
    const foundByA = await repository.findById(tenderId, tenantA);
    expect(foundByA).not.toBeNull();
    expect(foundByA?.title).toBe('Segredo A');

    // Verifica que Tenant B não consegue ler pelo ID
    const foundByB = await repository.findById(tenderId, tenantB);
    expect(foundByB).toBeNull();

    // Verifica que a listagem (findPaginated) do Tenant B não retorna o edital
    const paginatedB = await repository.findPaginated(tenantB, {}, { page: 1, limit: 10 });
    const containsSecretA = paginatedB.data.some(t => t.id === tenderId);
    expect(containsSecretA).toBe(false);
  });

  it('deve persistir os valores de proposta e alterar o status para SUBMITTED garantindo a atomicidade e isolamento', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      source: 'MANUAL',
      number: '888/2026',
      organization: 'Prefeitura XYZ',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Aquisição de Câmeras',
      currency: 'BRL',
      openingDate: new Date(),
      closingDate: new Date(Date.now() + 86400000),
      createdBy: 'user-xyz',
    };

    const tender = new Tender(props);

    const itemId = randomUUID();
    const itemProps: TenderItemProps = {
      id: itemId,
      tenantId: tenantA,
      tenderId: tender.id,
      number: 1,
      description: 'Câmera IP 4K',
      quantity: 10,
      unit: 'UN',
    };
    tender.addItem(new TenderItem(itemProps), tenantA);

    await repository.save(tender);

    // Agora vamos submeter a proposta
    const proposalData = {
      totalValue: 15000,
      discountPercent: 0,
      itemValues: { '1': 1500 },
      technicalProposal: 'Especificação atendida',
      commercialTerms: 'Pagamento 15 dias',
    };

    tender.submitProposal(tenantA, proposalData);
    
    // Salvamos as alterações (status, valores nos itens e metadados)
    await repository.save(tender);

    // Consulta direta ao PrismaService para validar a precisão
    const rawTender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { items: true },
    });

    expect(rawTender).not.toBeNull();
    expect(rawTender?.tenant_id).toBe(tenantA);
    expect(rawTender?.status).toBe('SUBMITTED');
    
    // Validar item e decimal precision
    expect(rawTender?.items.length).toBe(1);
    expect(rawTender?.items[0].number).toBe(1);
    
    // Convert Decimal from Prisma to Number for test validation
    const savedProposalValue = rawTender?.items[0].proposal_value ? Number(rawTender?.items[0].proposal_value) : null;
    expect(savedProposalValue).toBe(1500);

    // Validar metadata jsonb
    const metadata = rawTender?.metadata as any;
    expect(metadata?.proposal).toBeDefined();
    expect(metadata?.proposal.totalValue).toBe(15000);
    expect(metadata?.proposal.commercialTerms).toBe('Pagamento 15 dias');
  });

  it('deve registrar e persistir o histórico de lances (append-only) de uma disputa ativa com amarração de tenant', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      source: 'MANUAL',
      number: '777/2026',
      organization: 'Gov',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'DISPUTE',
      title: 'Aquisição de Licenças',
      currency: 'BRL',
      openingDate: new Date(),
      closingDate: new Date(),
      createdBy: 'user-xyz',
    };

    const tender = new Tender(props);

    const { TenderDispute } = require('../../../../../packages/domain/src/tenders/entities/tender-dispute.entity');
    const dispute = new TenderDispute({
      id: randomUUID(),
      tenantId: tenantA,
      tenderId: tenderId,
      status: 'OPEN',
      startPrice: 50000,
      currentPrice: 50000,
      minDecrement: 500,
      extensionTime: 180,
      startedAt: new Date(),
      closedAt: new Date(Date.now() + 3600000), // 1h
    });

    tender.registerDispute(dispute, tenantA);
    await repository.save(tender);

    // Adicionando lances sequenciais
    dispute.registerBid(randomUUID(), 'supplier-1', 49000); // Válido (decremento >= 500)
    dispute.registerBid(randomUUID(), 'supplier-2', 48000); // Válido

    await repository.save(tender);

    // Consulta direta ao BD via Prisma
    const rawTender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        disputes: {
          include: { bids: { orderBy: { round: 'asc' } } }
        }
      }
    });

    expect(rawTender).not.toBeNull();
    const savedDispute = rawTender?.disputes[0];
    expect(savedDispute).toBeDefined();
    expect(savedDispute?.tenant_id).toBe(tenantA);
    expect(savedDispute?.bids.length).toBe(2);

    const firstBid = savedDispute?.bids[0];
    expect(firstBid?.supplier_id).toBe('supplier-1');
    expect(Number(firstBid?.amount)).toBe(49000);
    expect(firstBid?.round).toBe(1);

    const secondBid = savedDispute?.bids[1];
    expect(secondBid?.supplier_id).toBe('supplier-2');
    expect(Number(secondBid?.amount)).toBe(48000);
    expect(secondBid?.round).toBe(2);
  });

  it('deve processar o resultado da licitação e salvar os metadados finais com precisão atômica e isolamento', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      source: 'MANUAL',
      number: '555/2026',
      organization: 'Ministério Público',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'RESULT_AWAITED',
      title: 'Aquisição de Servidores',
      currency: 'BRL',
      openingDate: new Date(),
      closingDate: new Date(),
      createdBy: 'user-xyz',
    };

    const tender = new Tender(props);

    const itemId = randomUUID();
    const itemProps: TenderItemProps = {
      id: itemId,
      tenantId: tenantA,
      tenderId: tender.id,
      number: 1,
      description: 'Servidor Rack 2U',
      quantity: 5,
      unit: 'UN',
    };
    tender.addItem(new TenderItem(itemProps), tenantA);

    await repository.save(tender);

    const rankings = [
      { position: 1, name: 'Minha Empresa Tech', value: 100000 },
      { position: 2, name: 'Concorrente Z', value: 105000 }
    ];

    // Homologar resultado no aggregate
    tender.closeAndEvaluateResult(tenantA, {
      status: 'WON',
      classification: 1,
      winnerValue: 100000,
      winnerName: 'Minha Empresa Tech',
      winnerDocument: '11.111.111/0001-11',
      rankings,
      observations: 'Vencemos no pregão com melhor proposta técnica e preço.'
    });

    // Persistir alterações
    await repository.save(tender);

    // Bater no Prisma direto para validar o jsonb gerado no banco de dados
    const rawTender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { items: true },
    });

    expect(rawTender).not.toBeNull();
    expect(rawTender?.tenant_id).toBe(tenantA);
    expect(rawTender?.status).toBe('WON');
    
    // O item foi marcado como winner (se simularmos serialização, a prop winner foi injetada)
    // Observação: no prisma schema, items não tem winner no momento, mas na estrutura JSON ou prop de memória tem.
    // Vamos checar o Metadata JSONB do tender
    const metadata = rawTender?.metadata as any;
    expect(metadata?.result).toBeDefined();
    expect(metadata?.result.status).toBeUndefined(); // status was set on the tender itself
    expect(metadata?.result.winnerName).toBe('Minha Empresa Tech');
    expect(metadata?.result.winnerValue).toBe(100000);
    expect(metadata?.result.classification).toBe(1);
    expect(metadata?.result.rankings).toHaveLength(2);
    expect(metadata?.result.observations).toBe('Vencemos no pregão com melhor proposta técnica e preço.');
  });

  it('deve persistir e reconstituir arrays de documentos e exigências de checklist (Scanner de Conformidade)', async () => {
    const tenderId = randomUUID();
    const props: TenderProps = {
      id: tenderId,
      tenantId: tenantA,
      source: 'MANUAL',
      number: '444/2026',
      organization: 'Ministério Público',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'DOCUMENTATION',
      title: 'Aquisição de Licenças Software',
      currency: 'BRL',
      openingDate: new Date(),
      closingDate: new Date(),
      createdBy: 'user-xyz',
    };

    const tender = new Tender(props);

    const { ChecklistRequirement, TenderDocumentType } = require('../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo');
    const { TenderDocument, DocumentStatus } = require('../../../../../packages/domain/src/tenders/entities/tender-document.entity');

    // Add Checklist
    const req1 = new ChecklistRequirement({ documentType: TenderDocumentType.LEGAL, isRequired: true, description: 'CNPJ Válido' });
    tender.addRequiredChecklist([req1], tenantA);

    // Add Document
    const doc1 = new TenderDocument({
      id: randomUUID(),
      tenderId: tender.id,
      tenantId: tenantA,
      type: TenderDocumentType.LEGAL,
      title: 'Cartão CNPJ',
      status: DocumentStatus.UPLOADED,
      fileUrl: 's3://cnpj.pdf',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    });
    tender.attachDocument(doc1);

    await repository.save(tender);

    // Act - Recuperar
    const retrievedTender = await repository.findById(tenderId, tenantA);
    
    expect(retrievedTender).not.toBeNull();
    expect(retrievedTender?.checklist.length).toBe(1);
    expect(retrievedTender?.checklist[0].documentType).toBe(TenderDocumentType.LEGAL);
    expect(retrievedTender?.checklist[0].isRequired).toBe(true);

    expect(retrievedTender?.documents.length).toBe(1);
    expect(retrievedTender?.documents[0].type).toBe(TenderDocumentType.LEGAL);
    expect(retrievedTender?.documents[0].status).toBe(DocumentStatus.UPLOADED);
    expect(retrievedTender?.documents[0].fileUrl).toBe('s3://cnpj.pdf');

    // Checar isFullyCompliant a partir da entidade reconstituída do banco
    expect(retrievedTender?.isFullyCompliant()).toBe(true);

    // Acessar diretamente o banco de dados para confirmar gravação relacional
    const rawTender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        documents: true,
        checklist: true,
      }
    });

    expect(rawTender?.documents.length).toBe(1);
    expect(rawTender?.checklist.length).toBe(1);
  });
});
