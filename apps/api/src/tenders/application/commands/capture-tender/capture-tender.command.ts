export class CaptureTenderCommand {
  readonly commandName = 'CaptureTenderCommand';

  constructor(
    public readonly tenantId: string,
    public readonly externalId: string | undefined,
    public readonly source: string,
    public readonly number: string,
    public readonly organization: string,
    public readonly department: string | undefined,
    public readonly modality: string,
    public readonly type: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly uf: string | undefined,
    public readonly city: string | undefined,
    public readonly estimatedValue: number | undefined,
    public readonly currency: string | undefined,
    public readonly openingDate: Date,
    public readonly closingDate: Date,
    public readonly documentUrl: string | undefined,
    public readonly createdBy: string,
  ) {}
}
