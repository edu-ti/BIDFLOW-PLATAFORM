import { Injectable, NotFoundException } from '@nestjs/common';
// @ts-ignore
import FPDF from 'node-fpdf';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class TenderProposalPdfService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trata o encoding de UTF-8 do Node para o formato binário suportado pelo FPDF.
   */
  private tratarTexto(texto: string): string {
    if (!texto) return '';
    return Buffer.from(texto, 'utf-8').toString('binary');
  }

  async gerarPdfProposta(tenderId: string): Promise<Buffer> {
    // a. Buscar o Tender e a Proposta Comercial
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        proposals: {
          where: { isSubmitted: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!tender) {
      throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
    }

    const proposal = tender.proposals[0];
    if (!proposal) {
      throw new NotFoundException(`Nenhuma proposta submetida foi encontrada para este edital.`);
    }

    // b. Inicializar FPDF
    const pdf = new FPDF('P', 'mm', 'A4');
    pdf.SetMargins(15, 15, 15);
    pdf.AddPage();

    // 4. Estrutura do PDF
    // Cabeçalho
    pdf.SetFont('Arial', 'B', 16);
    // Para cores escuras formais
    pdf.SetTextColor(30, 41, 59); // slate-800
    pdf.Cell(0, 10, this.tratarTexto('PROPOSTA COMERCIAL'), 0, 1, 'C');
    
    // Linha divisória
    pdf.SetDrawColor(148, 163, 184); // slate-400
    pdf.Line(15, 25, 195, 25);
    pdf.Ln(10);

    pdf.SetTextColor(15, 23, 42); // slate-900

    // Dados do Órgão Público e Identificador
    pdf.SetFont('Arial', 'B', 12);
    pdf.Cell(40, 8, this.tratarTexto('Órgão Público:'), 0, 0, 'L');
    pdf.SetFont('Arial', '', 12);
    pdf.Cell(0, 8, this.tratarTexto(tender.organization || 'Não informado'), 0, 1, 'L');

    pdf.SetFont('Arial', 'B', 12);
    pdf.Cell(40, 8, this.tratarTexto('Identificador:'), 0, 0, 'L');
    pdf.SetFont('Arial', '', 12);
    pdf.Cell(0, 8, this.tratarTexto(tender.externalId || 'Não informado'), 0, 1, 'L');

    pdf.Ln(5);

    // Objeto da Licitação
    pdf.SetFont('Arial', 'B', 12);
    pdf.Cell(0, 8, this.tratarTexto('Objeto da Licitação:'), 0, 1, 'L');
    pdf.SetFont('Arial', '', 11);
    pdf.MultiCell(0, 6, this.tratarTexto(tender.title || 'Sem título'), 0, 'J');

    pdf.Ln(15);

    // Bloco de Valores (Destaque)
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(proposal.totalValue));
    
    pdf.SetFont('Arial', 'B', 14);
    // Desenha uma borda simples ao redor do valor
    pdf.Cell(0, 15, this.tratarTexto(`Valor Final Proposto: ${formattedValue}`), 1, 1, 'C');

    pdf.Ln(10);

    // Observações
    if (proposal.observations) {
      pdf.SetFont('Arial', 'B', 12);
      pdf.Cell(0, 8, this.tratarTexto('Observações Comerciais:'), 0, 1, 'L');
      pdf.SetFont('Arial', '', 11);
      pdf.MultiCell(0, 6, this.tratarTexto(proposal.observations), 0, 'J');
    }

    // Rodapé: Assinatura do Representante Legal
    // Move para o fundo da página (ex: 50mm da base)
    pdf.SetY(-50);
    pdf.SetDrawColor(15, 23, 42); // slate-900
    pdf.Line(60, pdf.GetY(), 150, pdf.GetY());
    pdf.Ln(5);
    pdf.SetFont('Arial', '', 11);
    pdf.Cell(0, 6, this.tratarTexto('Assinatura do Representante Legal'), 0, 1, 'C');

    // 5. Retorna o PDF como Buffer
    const pdfOutputString = pdf.Output('S');
    return Buffer.from(pdfOutputString, 'binary');
  }
}
