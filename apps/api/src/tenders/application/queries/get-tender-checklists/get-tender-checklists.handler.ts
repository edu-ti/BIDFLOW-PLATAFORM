import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetTenderChecklistsQuery } from './get-tender-checklists.query';

@QueryHandler(GetTenderChecklistsQuery)
export class GetTenderChecklistsHandler implements IQueryHandler<GetTenderChecklistsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenderChecklistsQuery) {
    const { tenderId } = query;

    return this.prisma.tenderChecklist.findMany({
      where: { tenderId },
      include: {
        documents: true, // Assegura que trazes os documentos anexados ao checklist
      },
      orderBy: {
        order: 'asc',
      },
    });
  }
}
