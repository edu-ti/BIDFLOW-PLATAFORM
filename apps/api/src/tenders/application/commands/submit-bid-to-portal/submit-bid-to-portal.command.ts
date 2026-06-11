export class SubmitBidToPortalCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
  ) {}
}
