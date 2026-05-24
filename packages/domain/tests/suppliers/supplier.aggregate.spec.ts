import { Supplier, SupplierStatus } from '../../src/suppliers/entities/supplier.aggregate';
import { Cnpj } from '../../src/suppliers/value-objects/cnpj.vo';
import { BusinessRuleException } from '../../src/exceptions';

describe('Supplier Aggregate & CNPJ Value Object', () => {
  describe('Cnpj Value Object', () => {
    it('should successfully create a valid CNPJ', () => {
      // Valid CNPJ example
      const validCnpj = '11.222.333/0001-81';
      const cnpj = new Cnpj(validCnpj);
      
      expect(cnpj.value).toBe('11222333000181');
      expect(cnpj.formatted).toBe('11.222.333/0001-81');
    });

    it('should throw BusinessRuleException for invalid CNPJ length', () => {
      expect(() => new Cnpj('123')).toThrow(BusinessRuleException);
    });

    it('should throw BusinessRuleException for invalid check digits', () => {
      // Changed the last check digit to make it invalid
      expect(() => new Cnpj('11.222.333/0001-89')).toThrow(BusinessRuleException);
    });
  });

  describe('Supplier Aggregate', () => {
    let validCnpj: Cnpj;
    
    beforeAll(() => {
      validCnpj = new Cnpj('11.222.333/0001-81');
    });

    it('should update compliance score successfully within limits', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.ACTIVE,
        complianceScore: 100,
      });

      supplier.updateComplianceScore(80);
      expect(supplier.complianceScore).toBe(80);
      expect(supplier.status).toBe(SupplierStatus.ACTIVE);
    });

    it('should throw when compliance score is out of bounds', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.ACTIVE,
        complianceScore: 100,
      });

      expect(() => supplier.updateComplianceScore(-1)).toThrow(BusinessRuleException);
      expect(() => supplier.updateComplianceScore(101)).toThrow(BusinessRuleException);
    });

    it('should transition to UNDER_REVIEW when compliance score drops below 30', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.ACTIVE,
        complianceScore: 100,
      });

      supplier.updateComplianceScore(29);
      expect(supplier.status).toBe(SupplierStatus.UNDER_REVIEW);
      expect(supplier.metadata.reviewReason).toBeDefined();
    });

    it('should allow activation if compliance score > 50', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.UNDER_REVIEW,
        complianceScore: 60,
      });

      supplier.activateSupplier();
      expect(supplier.status).toBe(SupplierStatus.ACTIVE);
    });

    it('should prevent activation if compliance score <= 50', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.UNDER_REVIEW,
        complianceScore: 50,
      });

      expect(() => supplier.activateSupplier()).toThrow(BusinessRuleException);
    });

    it('should suspend supplier and append reason to metadata', () => {
      const supplier = new Supplier({
        id: 'sup-1',
        tenantId: 'tenant-1',
        corporateName: 'Corp A',
        tradeName: 'Trade A',
        cnpj: validCnpj,
        status: SupplierStatus.ACTIVE,
        complianceScore: 100,
      });

      supplier.suspendSupplier('Fraudulent documents');
      expect(supplier.status).toBe(SupplierStatus.SUSPENDED);
      expect(supplier.metadata.suspensionReason).toBe('Fraudulent documents');
    });
  });
});
