export class UpdateSupplierComplianceCommand {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly newScore: number
  ) {}
}
