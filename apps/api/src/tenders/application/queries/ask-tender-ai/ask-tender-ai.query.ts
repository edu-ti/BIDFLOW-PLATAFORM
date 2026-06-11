export class AskTenderAiQuery {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly question: string,
  ) {}
}
