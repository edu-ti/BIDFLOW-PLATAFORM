export class TenderAcceptedEvent {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly opportunityId: string,
  ) {}
}
