export class PlaceDisputeBidCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly supplierId: string,
  ) {}
}
