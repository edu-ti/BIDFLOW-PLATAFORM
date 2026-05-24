import { BusinessRuleException } from '../../exceptions';

export class Cnpj {
  private readonly _value: string;

  constructor(value: string) {
    const cleanValue = value.replace(/[^\d]/g, '');

    if (!this.isValid(cleanValue)) {
      throw new BusinessRuleException('Invalid CNPJ format or check digits', 'INVALID_CNPJ');
    }

    this._value = cleanValue;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    return this._value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  private isValid(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;

    // Eliminate known invalid sequences (e.g. 00000000000000)
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validate first check digit
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validate second check digit
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  public equals(other: Cnpj): boolean {
    if (!other) return false;
    return this._value === other.value;
  }
}
