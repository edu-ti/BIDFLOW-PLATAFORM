"use client";

import React, { useState, useEffect } from 'react';

export interface KanbanOpportunity {
  id: string;
  title: string;
  estimatedValue: number;
  currency: string;
  status: string;
  probability: number;
  tenderId: string;
  createdAt: string;
}

export interface KanbanColumn {
  stageId: string;
  title: string;
  order: number;
  opportunities: KanbanOpportunity[];
  totalValue: number;
  count: number;
}

export interface KanbanBoardData {
  pipeline: {
    id: string;
    name: string;
  };
  columns: KanbanColumn[];
}

export const CrmKanbanBoard: React.FC = () => {
  const [boardData, setBoardData] = useState<KanbanBoardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        // Note: Make sure the backend supports CORS and appropriate headers for the tenant token if needed.
        const response = await fetch(`${apiUrl}/v1/crm/pipelines/default/kanban`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar o quadro Kanban');
        }
        
        const data = await response.json();
        setBoardData(data);
      } catch (err) {
        console.error('Erro ao buscar pipeline:', err);
        setError('Ocorreu um erro de rede ao carregar as oportunidades do CRM.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-400 font-medium">A carregar funil de vendas...</span>
      </div>
    );
  }

  if (error || !boardData) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center bg-slate-900 border border-slate-700 rounded-xl">
        <div className="text-red-400 mb-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <p className="text-slate-300 font-medium text-center max-w-md">{error || 'Não foi possível carregar os dados.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 rounded-xl border border-slate-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">{boardData.pipeline.name}</h2>
          <p className="text-sm text-slate-400 mt-1">Visão geral e progresso das licitações qualificadas no seu funil.</p>
        </div>
      </div>

      {/* Kanban Board Container - Scroll Horizontal Infinito */}
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar h-[calc(100vh-250px)] min-h-[500px]">
        {boardData.columns.map((column) => (
          <div key={column.stageId} className="flex flex-col flex-shrink-0 w-80 bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg h-full">
            
            {/* Cabecalho da Coluna */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                {column.title}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700/50">
                  {column.count}
                </span>
              </div>
            </div>

            {/* Total Value da Coluna */}
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-700/50">
              <p className="text-xs font-medium text-slate-500 uppercase">Estimativa Total</p>
              <p className="text-sm font-bold text-slate-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(column.totalValue || 0)}
              </p>
            </div>

            {/* Area de Cartoes - Scroll Vertical */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {column.opportunities.map((opp) => (
                <div 
                  key={opp.id} 
                  className="bg-slate-800 border border-slate-700 p-4 rounded-lg cursor-grab hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                >
                  {/* Titulo Oportunidade */}
                  <h4 className="font-semibold text-slate-200 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-blue-400 transition-colors">
                    {opp.title}
                  </h4>
                  
                  {/* Meta Information */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {new Date(opp.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.estimatedValue || 0)}
                    </div>
                  </div>
                </div>
              ))}
              
              {column.opportunities.length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-700/50 rounded-lg">
                  <span className="text-xs font-medium text-slate-500">Sem oportunidades</span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
