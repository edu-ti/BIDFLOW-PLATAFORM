import { Injectable, NotFoundException } from '@nestjs/common';
// @ts-ignore
import FPDF from 'node-fpdf';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenderReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper privado que transforma a codificação UTF-8 padrão 
   * do banco (e do Node.js) em Binary/Latin-1 para que os 
   * caracteres especiais e acentos sejam renderizados no FPDF.
   */
  private tratarTexto(texto: string): string {
    if (!texto) return '';
    return Buffer.from(texto, 'utf-8').toString('binary');
  }

  async gerarPdfAuditoria(tenderId: string): Promise<Buffer> {
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
    }

    const metadata = (tender.metadataLlm as any) || {};
    const criterioJulgamento = metadata.criterio_julgamento || 'Não informado';
    const amparoLegal = metadata.amparo_legal || 'Não informado';

    const valorEstimadoFormatado = tender.estimatedValue 
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(tender.estimatedValue))
      : 'Não informado';

    const pdf = new FPDF('P', 'mm', 'A4');
    pdf.AddPage();
    pdf.SetMargins(15, 15, 15);
    pdf.SetAutoPageBreak(true, 15);

    // --- CABEÇALHO ---
    pdf.SetFont('Arial', 'B', 16);
    pdf.SetTextColor(40, 53, 65); 
    pdf.Cell(0, 10, 'BIDFLOW PLATFORM - RELATORIO DE AUDITORIA', 0, 1, 'C');

    pdf.SetFont('Arial', '', 10);
    pdf.SetTextColor(100, 100, 100);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    pdf.Cell(0, 6, `Data de Geracao: ${dataAtual}  |  ID do Edital: ${tender.id}`, 0, 1, 'C');

    pdf.SetDrawColor(200, 200, 200);
    pdf.Line(15, 35, 195, 35);
    pdf.Ln(10); 

    // --- SEÇÃO 1: IDENTIFICAÇÃO ---
    pdf.SetFont('Arial', 'B', 12);
    pdf.SetTextColor(40, 53, 65);
    pdf.Cell(0, 8, '1. Identificacao do Edital', 0, 1, 'L');
    pdf.Ln(2);

    pdf.SetFont('Arial', 'B', 10);
    pdf.SetTextColor(80, 80, 80);
    pdf.Cell(40, 6, 'Orgao Publico:', 0, 0, 'L');
    pdf.SetFont('Arial', '', 10);
    
    const currentY = pdf.GetY();
    pdf.SetXY(55, currentY);
    
    // Tratando o texto do Órgão Público
    pdf.MultiCell(0, 6, this.tratarTexto(tender.organization), 0, 'L');

    pdf.SetY(pdf.GetY() + 2);

    pdf.SetFont('Arial', 'B', 10);
    pdf.Cell(40, 6, 'Modalidade:', 0, 0, 'L');
    pdf.SetFont('Arial', '', 10);
    pdf.Cell(0, 6, tender.modality, 0, 1, 'L');

    pdf.SetFont('Arial', 'B', 10);
    pdf.Cell(40, 6, 'Identificador:', 0, 0, 'L');
    pdf.SetFont('Arial', '', 10);
    pdf.Cell(0, 6, tender.externalId, 0, 1, 'L');
    pdf.Ln(8);

    // --- SEÇÃO 2: RESUMO IA ---
    pdf.SetFont('Arial', 'B', 12);
    pdf.SetTextColor(40, 53, 65);
    pdf.Cell(0, 8, '2. Objeto (Resumo Estruturado por IA)', 0, 1, 'L');
    pdf.Ln(2);

    pdf.SetFillColor(245, 245, 245); 
    pdf.SetTextColor(50, 50, 50);
    pdf.SetFont('Arial', 'I', 10);
    
    // Tratando o título/resumo dinâmico que vem da IA
    pdf.MultiCell(0, 6, this.tratarTexto(tender.title), 0, 'J', 1);
    
    pdf.Ln(8);

    // --- SEÇÃO 3: CRITÉRIOS LEGAIS E FINANCEIROS ---
    pdf.SetFont('Arial', 'B', 12);
    pdf.SetTextColor(40, 53, 65);
    pdf.Cell(0, 8, '3. Criterios Legais e Financeiros', 0, 1, 'L');
    pdf.Ln(2);

    pdf.SetFont('Arial', 'B', 10);
    pdf.SetDrawColor(210, 210, 210); 
    pdf.SetFillColor(235, 235, 235); 
    
    pdf.Cell(60, 8, ' Criterio de Julgamento', 1, 0, 'L', 1);
    pdf.Cell(60, 8, ' Amparo Legal', 1, 0, 'L', 1);
    pdf.Cell(60, 8, ' Valor Estimado', 1, 1, 'L', 1);

    pdf.SetFont('Arial', '', 10);
    pdf.SetTextColor(80, 80, 80);
    
    // Tratando critério de julgamento e amparo legal
    pdf.Cell(60, 8, ` ${this.tratarTexto(criterioJulgamento)}`, 1, 0, 'L');
    pdf.Cell(60, 8, ` ${this.tratarTexto(amparoLegal)}`, 1, 0, 'L');
    
    pdf.Cell(60, 8, ` ${valorEstimadoFormatado}`, 1, 1, 'L');
    
    // --- RODAPÉ ---
    pdf.SetY(-30);
    pdf.SetFont('Arial', 'I', 8);
    pdf.SetTextColor(150, 150, 150);
    const disclaimer = "NOTA DE ISENCAO: Este relatorio de auditoria foi gerado de forma automatizada pela IA BidFlow.\n" +
                       "Sua criacao nao dispensa a leitura na integra do edital publico nem a revisao humana especializada.";
    pdf.MultiCell(0, 4, disclaimer, 0, 'C');

    const pdfRawString = pdf.Output('S');
    return Buffer.from(pdfRawString, 'binary'); 
  }
}
