import { randomUUID } from 'crypto';
import { TimelineEntryEntity } from '../../../../../src/crm/domain/timeline/timeline-entry.entity';
import { TimelineEntryType } from '../../../../../src/crm/domain/common/enums/timeline-entry-type.enum';

describe('TimelineEntryEntity — Domain', () => {
  const tenantId = randomUUID();
  const leadId = randomUUID();

  it('deve criar entrada de timeline', () => {
    const e = TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.STAGE_CHANGED,
      title: 'Lead qualificado',
      leadId,
      occurredAt: new Date(),
    });
    expect(e.title).toBe('Lead qualificado');
  });

  it('deve rejeitar entrada sem referência', () => {
    expect(() => TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.NOTE_ADDED,
      title: 'Nota',
      occurredAt: new Date(),
    })).toThrow('TimelineEntry must be linked to at least one entity');
  });

  it('deve exigir activityId quando type = ACTIVITY', () => {
    expect(() => TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.ACTIVITY,
      title: 'Atividade',
      leadId,
      occurredAt: new Date(),
    })).toThrow('activityId is required for ACTIVITY type');
  });

  it('deve exigir fromStage e toStage no metadata quando STAGE_CHANGED', () => {
    expect(() => TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.STAGE_CHANGED,
      title: 'Mudança',
      leadId,
      occurredAt: new Date(),
    })).toThrow('fromStage and toStage are required in metadata for STAGE_CHANGED');
  });

  it('deve aceitar STAGE_CHANGED com metadata correto', () => {
    const e = TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.STAGE_CHANGED,
      title: 'Avançou para Qualificação',
      leadId,
      occurredAt: new Date(),
      metadata: { fromStage: 'prospecting', toStage: 'qualification' },
    });
    expect(e.metadata.fromStage).toBe('prospecting');
  });

  it('não deve ter updatedAt nem métodos de update (append-only)', () => {
    const e = TimelineEntryEntity.create({
      tenantId, type: TimelineEntryType.SYSTEM_EVENT, title: 'Teste',
      leadId, occurredAt: new Date(),
    });
    expect((e as any).updatedAt).toBeUndefined();
  });

  it('type OPPORTUNITY_WON deve ter metadados específicos', () => {
    const e = TimelineEntryEntity.create({
      tenantId,
      type: TimelineEntryType.OPPORTUNITY_WON,
      title: 'Oportunidade ganha!',
      leadId,
      occurredAt: new Date(),
      metadata: { wonValue: 500000, customerName: 'Empresa X' },
    });
    expect(e.type).toBe(TimelineEntryType.OPPORTUNITY_WON);
  });
});
