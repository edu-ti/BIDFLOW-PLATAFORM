import { randomUUID } from 'crypto';
import { PipelineEntity } from '../../../../../src/crm/domain/pipeline/pipeline.entity';
import { PipelineMinStagesError } from '../../../../../src/crm/domain/common/errors/pipeline-min-stages.error';

describe('PipelineEntity — Domain', () => {
  const tenantId = randomUUID();

  const validStages = [
    { id: 'open', name: 'Aberto', order: 1, probability: 10, color: '#e8f5e9' },
    { id: 'progress', name: 'Em Andamento', order: 2, probability: 50, color: '#a5d6a7' },
    { id: 'closed', name: 'Fechado', order: 3, probability: 90, color: '#66bb6a' },
  ];

  describe('create()', () => {
    it('deve criar pipeline com estágios', () => {
      const pipe = PipelineEntity.create({
        tenantId,
        name: 'Vendas',
        slug: 'vendas',
        stages: validStages,
      });
      expect(pipe.name).toBe('Vendas');
      expect(pipe.stages.length).toBe(3);
    });

    it('deve rejeitar pipeline com menos de 2 estágios', () => {
      expect(() => PipelineEntity.create({
        tenantId,
        name: 'Vendas',
        slug: 'vendas',
        stages: [{ id: 'only', name: 'Único', order: 1, probability: 50, color: '#fff' }],
      })).toThrow(PipelineMinStagesError);
    });

    it('deve rejeitar probabilidade não crescente', () => {
      expect(() => PipelineEntity.create({
        tenantId,
        name: 'Vendas',
        slug: 'vendas',
        stages: [
          { id: 'a', name: 'A', order: 1, probability: 50, color: '#fff' },
          { id: 'b', name: 'B', order: 2, probability: 30, color: '#fff' },
        ],
      })).toThrow('Stage probabilities must be increasing');
    });

    it('deve rejeitar slugs duplicados entre estágios', () => {
      expect(() => PipelineEntity.create({
        tenantId,
        name: 'Vendas',
        slug: 'vendas',
        stages: [
          { id: 'dup', name: 'A', order: 1, probability: 10, color: '#fff' },
          { id: 'dup', name: 'B', order: 2, probability: 50, color: '#fff' },
        ],
      })).toThrow('Duplicate stage id: dup');
    });
  });

  describe('getStage()', () => {
    it('deve retornar estágio por ID', () => {
      const pipe = PipelineEntity.create({ tenantId, name: 'Vendas', slug: 'vendas', stages: validStages });
      const stage = pipe.getStage('progress');
      expect(stage.name).toBe('Em Andamento');
    });

    it('deve retornar null para estágio inexistente', () => {
      const pipe = PipelineEntity.create({ tenantId, name: 'Vendas', slug: 'vendas', stages: validStages });
      expect(pipe.getStage('inexistente')).toBeNull();
    });
  });

  describe('validateTransition()', () => {
    it('deve aceitar transição para estágio com order maior', () => {
      const pipe = PipelineEntity.create({ tenantId, name: 'Vendas', slug: 'vendas', stages: validStages });
      expect(pipe.validateTransition('open', 'progress')).toBe(true);
    });

    it('deve rejeitar transição para estágio com order menor ou igual', () => {
      const pipe = PipelineEntity.create({ tenantId, name: 'Vendas', slug: 'vendas', stages: validStages });
      expect(pipe.validateTransition('progress', 'open')).toBe(false);
    });
  });
});
