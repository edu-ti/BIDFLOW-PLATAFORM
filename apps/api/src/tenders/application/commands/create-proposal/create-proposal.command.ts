import { CreateTenderProposalDto } from './create-proposal.dto';

export class CreateTenderProposalCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly createdBy: string,
    public readonly dto: CreateTenderProposalDto,
  ) {}
}
