"use client";

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { TenderCard, TenderMatchPayload } from '../components/TenderCard';

const mockTender: TenderMatchPayload = {
  tenderId: 'mock-1234-5678',
  title: 'Contratação de empresa especializada no fornecimento de equipamentos de tecnologia da informação, incluindo infraestrutura de redes e suporte técnico corporativo.',
  organization: 'Tribunal de Justiça do Estado',
  affinity: 92,
  metadataLlm: {
    objeto_resumido: 'Fornecimento de equipamentos de TI e suporte técnico.',
    valor_estimado: 250000.00,
    amparo_legal: 'Lei 14.133/2021',
    criterio_julgamento: 'Menor Preço Global'
  }
};

export default function CockpitPage() {
  const [tenders, setTenders] = useState<TenderMatchPayload[]>([mockTender]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Inicializa a ligação WebSocket com o backend da API
    // Pode utilizar a variável de ambiente se estiver em produção
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado ao Cockpit WebSocket!');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado do Cockpit WebSocket!');
    });

    // Ouve o evento de novos matches da LLM disparados pelo backend
    socket.on('new_tender_match', (payload: TenderMatchPayload) => {
      // Adiciona o novo edital recebido ao topo (início) do array
      setTenders((prevTenders) => [payload, ...prevTenders]);
    });

    // Limpeza: desliga o socket quando o componente é desmontado
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-10 font-sans">
      
      {/* Cabeçalho do Cockpit */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            BidFlow <span className="text-blue-500">Cockpit</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Monitorização Real-Time de Editais e Matches Semânticos
          </p>
        </div>

        {/* Status de Conexão WebSocket */}
        <div className="mt-4 md:mt-0 flex items-center bg-slate-800 rounded-full py-2 px-4 border border-slate-700 shadow-sm">
          <div className="relative flex h-3 w-3 mr-3">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            )}
          </div>
          <span className="text-sm font-medium">
            {isConnected ? 'Conectado • A aguardar editais...' : 'A conectar...'}
          </span>
        </div>
      </header>

      {/* Renderização Dinâmica da Grelha de Editais */}
      <main>
        {tenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <p>Nenhum edital encontrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenders.map((tender, index) => (
              // Usamos o index como fallback na key para garantir unicidade caso chegue um id duplicado do websocket
              <TenderCard key={`${tender.tenderId}-${index}`} tender={tender} />
            ))}
          </div>
        )}
      </main>
      
    </div>
  );
}