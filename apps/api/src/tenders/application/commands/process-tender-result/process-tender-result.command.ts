// @ts-nocheck
import { TenderStatus } from '../../../../packages/domain/src/tenders/tender.aggregate';

export class ProcessTenderResultCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly status: TenderStatus,
    public readonly classification: number,
    public readonly winnerValue: number,
    public readonly winnerName: string,
    public readonly winnerDocument: string,
    public readonly rankings?: any,
    public readonly observations?: string,
  ) {}
}
