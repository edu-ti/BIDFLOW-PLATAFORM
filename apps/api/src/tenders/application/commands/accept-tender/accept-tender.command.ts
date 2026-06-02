export class AcceptTenderCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
  ) {}
}
