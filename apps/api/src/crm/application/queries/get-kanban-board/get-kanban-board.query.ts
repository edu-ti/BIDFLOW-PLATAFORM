export class GetKanbanBoardQuery {
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId?: string,
  ) {}
}
