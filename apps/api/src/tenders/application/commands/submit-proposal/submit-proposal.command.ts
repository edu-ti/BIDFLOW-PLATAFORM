export class SubmitProposalCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly totalValue: number,
    public readonly discountPercent?: number,
    public readonly itemValues?: Record<string, number>,
    public readonly technicalProposal?: string,
    public readonly commercialTerms?: string,
  ) {}
}
