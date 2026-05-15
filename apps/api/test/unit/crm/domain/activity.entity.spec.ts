import { randomUUID } from 'crypto';
import { ActivityEntity } from '../../../../../src/crm/domain/activity/activity.entity';
import { ActivityType } from '../../../../../src/crm/domain/common/enums/activity-type.enum';

describe('ActivityEntity — Domain', () => {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const leadId = randomUUID();

  it('deve criar atividade com dados mínimos', () => {
    const a = ActivityEntity.create({
      tenantId,
      type: ActivityType.CALL,
      subject: 'Ligação de follow-up',
      leadId,
      createdBy: userId,
    });
    expect(a.subject).toBe('Ligação de follow-up');
    expect(a.createdBy).toBe(userId);
  });

  it('deve aceitar campos opcionais', () => {
    const a = ActivityEntity.create({
      tenantId,
      type: ActivityType.MEETING,
      subject: 'Reunião presencial',
      leadId,
      createdBy: userId,
      description: 'Cliente demonstrou interesse',
      duration: 60,
      outcome: 'Positivo, agendamos proposta',
      isPinned: true,
    });
    expect(a.duration).toBe(60);
    expect(a.isPinned).toBe(true);
  });

  it('deve rejeitar atividade sem referência (lead, customer ou opportunity)', () => {
    expect(() => ActivityEntity.create({
      tenantId,
      type: ActivityType.NOTE,
      subject: 'Nota solta',
      createdBy: userId,
    })).toThrow('Activity must be linked to at least one entity');
  });

  it('deve rejeitar criar activity type SYSTEM manualmente', () => {
    expect(() => ActivityEntity.create({
      tenantId,
      type: ActivityType.SYSTEM,
      subject: 'Evento de sistema',
      leadId,
      createdBy: userId,
    })).toThrow('SYSTEM activity cannot be created manually');
  });

  it('subject deve ter até 500 caracteres', () => {
    expect(() => ActivityEntity.create({
      tenantId,
      type: ActivityType.NOTE,
      subject: 'x'.repeat(501),
      leadId,
      createdBy: userId,
    })).toThrow('Subject exceeds maximum length');
  });

  it('não deve ter updatedAt (append-only)', () => {
    const a = ActivityEntity.create({
      tenantId, type: ActivityType.EMAIL, subject: 'Email',
      leadId, createdBy: userId,
    });
    expect((a as any).updatedAt).toBeUndefined();
  });
});
