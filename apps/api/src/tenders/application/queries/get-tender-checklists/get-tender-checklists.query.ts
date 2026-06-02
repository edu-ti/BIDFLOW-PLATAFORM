export class GetTenderChecklistsQuery {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
  ) {}
}
