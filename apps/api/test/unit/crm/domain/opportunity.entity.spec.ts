import { randomUUID } from 'crypto';
import { OpportunityEntity } from '../../../../../src/crm/domain/opportunity/opportunity.entity';
import { OpportunityStatus } from '../../../../../src/crm/domain/common/enums/opportunity-status.enum';
import { InvalidStageTransitionError } from '../../../../../src/crm/domain/common/errors/invalid-stage-transition.error';

describe('OpportunityEntity — Domain', () => {
  const tenantId = randomUUID();
  const pipelineId = randomUUID();
  const customerId = randomUUID();

  const pipelineStages = [
    { id: 'prospecting', name: 'Prospecção', order: 1, probability: 10 },
    { id: 'qualification', name: 'Qualificação', order: 2, probability: 25 },
    { id: 'proposal', name: 'Proposta', order: 3, probability: 50 },
    { id: 'negotiation', name: 'Negociação', order: 4, probability: 75 },
    { id: 'closing', name: 'Fechamento', order: 5, probability: 90 },
  ];

  const validProps = () => ({
    tenantId,
    pipelineId,
    customerId,
    title: 'Fornecimento de TI',
    estimatedValue: 500000,
    stage: 'prospecting',
    stages: pipelineStages,
  });

  describe('create()', () => {
    it('deve criar oportunidade com status OPEN', () => {
      const opp = OpportunityEntity.create(validProps());
      expect(opp.status).toBe(OpportunityStatus.OPEN);
      expect(opp.stage).toBe('prospecting');
      expect(opp.probability).toBe(10);
    });

    it('deve rejeitar estágio inválido no pipeline', () => {
      expect(() => OpportunityEntity.create({
        ...validProps(),
        stage: 'inexistente',
      })).toThrow('Stage inexistente not found in pipeline');
    });

    it('deve rejeitar título vazio', () => {
      expect(() => OpportunityEntity.create({ ...validProps(), title: '' }))
        .toThrow('Title is required');
    });
  });

  describe('moveStage()', () => {
    it('deve avançar para próximo estágio', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('qualification', userId);
      expect(opp.stage).toBe('qualification');
      expect(opp.stageOrder).toBe(2);
      expect(opp.probability).toBe(25);
      expect(opp.previousStage).toBe('prospecting');
    });

    it('deve avançar múltiplos estágios', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('proposal', userId);
      expect(opp.stage).toBe('proposal');
      expect(opp.stageOrder).toBe(3);
    });

    it('deve rejeitar estágio anterior (não regredir sem permissão)', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('qualification', userId);
      expect(() => opp.moveStage('prospecting', userId))
        .toThrow(InvalidStageTransitionError);
    });

    it('deve disparar OpportunityStageChangedEvent', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('qualification', userId);
      const events = opp.getDomainEvents();
      expect(events.some(e => e.type === 'com.bidflow.crm.opportunity.stage_changed.v1')).toBe(true);
    });
  });

  describe('win()', () => {
    it('deve marcar oportunidade como WON', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.win(550000, new Date('2026-06-30'));
      expect(opp.status).toBe(OpportunityStatus.WON);
      expect(opp.wonValue).toBe(550000);
      expect(opp.actualCloseDate).toEqual(new Date('2026-06-30'));
    });

    it('deve rejeitar win sem wonValue', () => {
      const opp = OpportunityEntity.create(validProps());
      expect(() => opp.win(0, new Date())).toThrow('Won value must be greater than zero');
    });

    it('deve rejeitar win de oportunidade já WON', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.win(550000, new Date());
      expect(() => opp.win(600000, new Date())).toThrow('Opportunity is already won');
    });

    it('deve disparar OpportunityWonEvent', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.win(550000, new Date());
      expect(opp.getDomainEvents().some(e => e.type === 'com.bidflow.crm.opportunity.won.v1')).toBe(true);
    });
  });

  describe('lose()', () => {
    it('deve marcar oportunidade como LOST', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.lose('PRICE', 'Concorrente ofereceu 20% abaixo', 'Concorrente X');
      expect(opp.status).toBe(OpportunityStatus.LOST);
      expect(opp.lostReason).toBe('PRICE');
      expect(opp.lostTo).toBe('Concorrente X');
    });

    it('deve rejeitar lose sem motivo', () => {
      const opp = OpportunityEntity.create(validProps());
      expect(() => opp.lose('', '')).toThrow('Lost reason is required');
    });

    it('deve rejeitar lose de oportunidade já WON', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.win(550000, new Date());
      expect(() => opp.lose('PRICE', '')).toThrow('Cannot lose an already won opportunity');
    });

    it('deve disparar OpportunityLostEvent', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.lose('PRICE', 'Muito caro');
      expect(opp.getDomainEvents().some(e => e.type === 'com.bidflow.crm.opportunity.lost.v1')).toBe(true);
    });
  });

  describe('regressStage()', () => {
    it('deve regredir estágio com justificativa', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('qualification', userId);
      opp.regressStage('prospecting', 'Precisa de mais informações', userId);
      expect(opp.stage).toBe('prospecting');
    });

    it('deve rejeitar regressão sem justificativa', () => {
      const opp = OpportunityEntity.create(validProps());
      opp.moveStage('qualification', userId);
      expect(() => opp.regressStage('prospecting', '', userId))
        .toThrow('Reason is required to regress stage');
    });
  });
});
