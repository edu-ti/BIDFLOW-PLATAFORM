import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module';
import { PipelineController } from './api/controllers/pipeline.controller';
import { GetKanbanBoardHandler } from './application/queries/get-kanban-board/get-kanban-board.handler';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [PipelineController],
  providers: [
    GetKanbanBoardHandler,
  ],
})
export class CrmModule {}
