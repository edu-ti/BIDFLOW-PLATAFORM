import { BusinessRuleException } from './index';

export class SupplierNotFoundException extends BusinessRuleException {
  constructor(id: string) {
    super(`Supplier with id ${id} not found`, 'SUPPLIER_NOT_FOUND');
    this.name = 'SupplierNotFoundException';
  }
}
