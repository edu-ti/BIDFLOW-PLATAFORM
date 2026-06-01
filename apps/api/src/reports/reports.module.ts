import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { TenderReportService } from './tender-report.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController],
  providers: [TenderReportService],
  exports: [TenderReportService],
})
export class ReportsModule {}
