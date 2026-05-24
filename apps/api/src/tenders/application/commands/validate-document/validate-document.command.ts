export class ValidateTenderDocumentCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly documentId: string,
    public readonly reason?: string,
  ) {}
}
