export class RegisterSupplierCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly corporateName: string,
    public readonly tradeName: string,
    public readonly cnpj: string,
    public readonly metadata?: Record<string, any>
  ) {}
}
