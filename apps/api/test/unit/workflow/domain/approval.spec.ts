import { randomUUID } from 'crypto';
import { ApprovalEntity } from '../../../../src/workflow/domain/approval/approval.entity';
import { ApprovalMode, ApprovalStatus } from '../../../../src/workflow/domain/common/enums';

import { ApprovalAlreadyDecidedError, MaxDelegationExceededError, SelfApprovalDeniedError } from '../../../../src/workflow/domain/common/errors';
import { makeApprovalProps } from '../../../fixtures/workflow.fixtures';


describe('ApprovalEntity — Domain', () => {
  const instanceId = randomUUID();
  const stageId = randomUUID();
  const userId = randomUUID();

  describe('create()', () => {
    it('deve criar approval PENDING', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      expect(a.status).toBe(ApprovalStatus.PENDING);
    });

    it('deve rejeitar self-approval se configurado', () => {
      expect(() => ApprovalEntity.create(makeApprovalProps(instanceId, stageId, { allowSelfApproval: false, assignedTo: userId, instanceCreatedBy: userId })))
        .toThrow(SelfApprovalDeniedError);
    });
  });

  describe('approve() / reject()', () => {
    it('deve aprovar com status APPROVED', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.approve('Tudo ok');
      expect(a.status).toBe(ApprovalStatus.APPROVED);
      expect(a.isApproved).toBe(true);
    });

    it('deve rejeitar e exigir comentário', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.reject('Documentação incompleta');
      expect(a.status).toBe(ApprovalStatus.REJECTED);
    });

    it('deve rejeitar reject sem comentário', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      expect(() => a.reject('')).toThrow('Comment is required for rejection');
    });

    it('deve rejeitar double decision', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.approve();
      expect(() => a.approve()).toThrow(ApprovalAlreadyDecidedError);
    });
  });

  describe('delegate()', () => {
    it('deve delegar para outro usuário', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.delegate(randomUUID());
      expect(a.getDomainEvents().some(e => e.type === 'com.bidflow.workflow.approval.delegated.v1')).toBe(true);
    });

    it('deve rejeitar delegar para si mesmo', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      expect(() => a.delegate(a.assignedTo)).toThrow('Cannot delegate to yourself');
    });

    it('deve rejeitar delegar duas vezes', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.delegate(randomUUID());
      expect(() => a.delegate(randomUUID())).toThrow(MaxDelegationExceededError);
    });
  });

  describe('skip() / markExpired()', () => {
    it('deve marcar como SKIPPED', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.skip();
      expect(a.status).toBe(ApprovalStatus.SKIPPED);
    });

    it('deve marcar como EXPIRED', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.markExpired();
      expect(a.status).toBe(ApprovalStatus.EXPIRED);
    });

    it('não deve alterar se já decidido', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.approve();
      a.markExpired();
      expect(a.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe('disparo de eventos', () => {
    it('approve dispara ApprovalCompletedEvent', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.approve();
      expect(a.getDomainEvents().some(e => e.type === 'com.bidflow.workflow.approval.completed.v1')).toBe(true);
    });

    it('reject dispara ApprovalCompletedEvent', () => {
      const a = ApprovalEntity.create(makeApprovalProps(instanceId, stageId));
      a.reject('Motivo');
      expect(a.getDomainEvents().some(e => e.type === 'com.bidflow.workflow.approval.completed.v1')).toBe(true);
    });
  });
});

const userId = randomUUID();
