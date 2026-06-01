import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { TenderReportService } from './tender-report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly tenderReportService: TenderReportService) {}

  @Get('tender/:id/pdf')
  async downloadAuditoria(
    @Param('id') tenderId: string, 
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.tenderReportService.gerarPdfAuditoria(tenderId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="auditoria_edital_${tenderId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.status(HttpStatus.OK).end(pdfBuffer);
      
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        return res.status(HttpStatus.NOT_FOUND).json({
           statusCode: 404,
           message: error.message
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: 'Ocorreu um erro fatal ao gerar o PDF de Auditoria.',
        error: error.message
      });
    }
  }
}
