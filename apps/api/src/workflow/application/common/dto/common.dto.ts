export class PaginatedResponse<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
  }
}

export class BatchOperationResponse {
  constructor(
    readonly totalProcessed: number,
    readonly successCount: number,
    readonly failureCount: number,
    readonly errors: Array<{ index: number; error: string; item?: unknown }> = [],
  ) {}
}
