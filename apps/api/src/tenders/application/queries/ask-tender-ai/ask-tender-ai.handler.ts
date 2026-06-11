import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AskTenderAiQuery } from './ask-tender-ai.query';

@Injectable()
@QueryHandler(AskTenderAiQuery)
export class AskTenderAiHandler implements IQueryHandler<AskTenderAiQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: AskTenderAiQuery): Promise<{ answer: string }> {
    const { tenderId, tenantId, question } = query;

    // a. Verifica se o Tender existe para este tenantId
    const tender = await this.prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender || (tender.tenantId !== tenantId && tender.tenantId !== 'system')) {
      throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
    }

    try {
      // b. Usa a API do modelo de embeddings local (Ollama)
      const embedResponse = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text', // ou outro modelo configurado
          prompt: question,
        }),
      });

      if (!embedResponse.ok) {
        throw new Error('Falha ao obter embeddings do Ollama');
      }

      const embedData = await embedResponse.json();
      const questionVector = embedData.embedding;

      // c. Faz uma query RAW ao Prisma para encontrar os 3 blocos de texto (chunks) mais relevantes
      const chunks = await this.prisma.$queryRawUnsafe<Array<{ text_chunk: string }>>(
        `SELECT text_chunk FROM tender_embeddings 
         WHERE tender_id = $1 
         ORDER BY embedding <=> $2::vector 
         LIMIT 3`,
        tenderId,
        JSON.stringify(questionVector)
      );

      // d. Junta os textos encontrados num único bloco de contexto
      const contexto = chunks.map((c) => c.text_chunk).join('\n\n');

      if (!contexto) {
        return { answer: "Não encontrei informação relevante neste edital para responder à sua pergunta." };
      }

      // e. Monta o Prompt para o Gemma
      const prompt = `És um assistente jurídico especialista em licitações públicas. Baseado APENAS no seguinte contexto extraído do edital, responde à pergunta de forma direta e profissional. Contexto: ${contexto}. Pergunta: ${question}`;

      // f. Faz o POST para o LLM local (Ollama)
      const generateResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma:latest',
          prompt: prompt,
          stream: false,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Falha ao gerar resposta do modelo Gemma');
      }

      const generateData = await generateResponse.json();

      // g. Retorna a resposta
      return { answer: generateData.response };

    } catch (error) {
      console.error('Erro no fluxo RAG (AI):', error);
      throw new InternalServerErrorException(
        'O serviço de IA está temporariamente indisponível. Por favor, certifique-se de que o Ollama está a correr localmente.'
      );
    }
  }
}
