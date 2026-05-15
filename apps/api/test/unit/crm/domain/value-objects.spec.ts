import { randomUUID } from 'crypto';
import { Money } from '../../../../../src/crm/domain/common/value-objects/money';
import { Email } from '../../../../../src/crm/domain/common/value-objects/email';
import { Probability } from '../../../../../src/crm/domain/opportunity/value-objects/probability';

describe('Value Objects — CRM', () => {
  describe('Money', () => {
    it('deve criar com valor positivo', () => {
      const m = new Money(50000, 'BRL');
      expect(m.amount).toBe(50000);
      expect(m.currency).toBe('BRL');
    });

    it('deve rejeitar valor negativo', () => {
      expect(() => new Money(-100, 'BRL')).toThrow('Amount must be positive');
    });

    it('deve rejeitar moeda inválida', () => {
      expect(() => new Money(100, 'XYZ')).toThrow('Invalid currency');
    });

    it('dois objetos com mesmo valor devem ser iguais', () => {
      const a = new Money(1000, 'BRL');
      const b = new Money(1000, 'BRL');
      expect(a.equals(b)).toBe(true);
    });

    it('deve suportar operações matemáticas', () => {
      const a = new Money(1000, 'BRL');
      const b = new Money(300, 'BRL');
      const sum = a.add(b);
      expect(sum.amount).toBe(1300);
    });

    it('deve rejeitar operações entre moedas diferentes', () => {
      const a = new Money(1000, 'BRL');
      const b = new Money(300, 'USD');
      expect(() => a.add(b)).toThrow('Currency mismatch');
    });
  });

  describe('Email', () => {
    it('deve criar email válido', () => {
      const email = new Email('joao@empresa.com.br');
      expect(email.value).toBe('joao@empresa.com.br');
    });

    it('deve normalizar para lowercase', () => {
      const email = new Email('Joao@Empresa.COM');
      expect(email.value).toBe('joao@empresa.com');
    });

    it('deve rejeitar email sem @', () => {
      expect(() => new Email('joaoempresa')).toThrow('Invalid email');
    });

    it('deve rejeitar email sem domínio', () => {
      expect(() => new Email('joao@')).toThrow('Invalid email');
    });

    it('deve rejeitar email vazio', () => {
      expect(() => new Email('')).toThrow('Invalid email');
    });
  });

  describe('Probability', () => {
    it('deve criar probabilidade válida', () => {
      const p = new Probability(75);
      expect(p.value).toBe(75);
    });

    it('deve rejeitar probabilidade abaixo de 0', () => {
      expect(() => new Probability(-1)).toThrow('Probability must be between 0 and 100');
    });

    it('deve rejeitar probabilidade acima de 100', () => {
      expect(() => new Probability(101)).toThrow('Probability must be between 0 and 100');
    });

    it('probabilidade 0 e 100 são válidas', () => {
      expect(() => new Probability(0)).not.toThrow();
      expect(() => new Probability(100)).not.toThrow();
    });
  });
});
