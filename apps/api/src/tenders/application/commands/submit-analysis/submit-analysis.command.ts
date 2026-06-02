import { SubmitTenderAnalysisDto } from './submit-analysis.dto';

export class SubmitTenderAnalysisCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly analystId: string,
    public readonly dto: SubmitTenderAnalysisDto,
  ) {}
}
