import React, { useState } from 'react';

interface MetadataLlm {
  objeto_resumido?: string;
  valor_estimado?: number | null;
  amparo_legal?: string;
  criterio_julgamento?: string;
}

export interface TenderMatchPayload {
  tenderId: string;
  title: string;
  organization: string;
  affinity: number;
  metadataLlm?: MetadataLlm;
}

interface TenderCardProps {
  tender: TenderMatchPayload;
  onAccepted?: (id: string) => void;
}

export const TenderCard: React.FC<TenderCardProps> = ({ tender, onAccepted }) => {
  const { tenderId, title, organization, affinity, metadataLlm } = tender;
  
  // Estado para controlar o botão de aceite
  const [isAccepting, setIsAccepting] = useState(false);

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return 'Não informado';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const badgeClasses =
    affinity >= 80
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';

  const handleAcceptTender = async () => {
    setIsAccepting(true);
    try {
      // Ajusta o URL da API através de variável de ambiente ou usa localhost por padrão
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/v1/tenders/${tenderId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Nota: Pode ser necessário passar o token JWT aqui dependendo da auth da API
          // 'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({}),
      });

      if (response.ok || response.status === 201) {
        alert("Oportunidade enviada para o CRM!");
        if (onAccepted) {
          onAccepted(tenderId);
        }
      } else {
        alert("Falha ao aceitar edital. Verifica o console para mais detalhes.");
        console.error("Erro da API:", await response.text());
      }
    } catch (error) {
      console.error("Erro na request:", error);
      alert("Erro de conexão ao aceitar edital.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5 transition-all hover:border-slate-600 hover:shadow-xl group h-full">
      
      <div className="flex justify-between items-start mb-3 gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 line-clamp-2">
          {organization}
        </span>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badgeClasses}`}>
          {affinity}% Match
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-5 leading-tight group-hover:text-blue-400 transition-colors line-clamp-3">
        {title}
      </h3>

      <div className="flex-grow"></div>

      {metadataLlm && (
        <div className="grid grid-cols-2 gap-y-4 gap-x-3 bg-slate-900/80 rounded-lg p-4 border border-slate-700/50 mt-auto mb-4">
          
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Amparo Legal
            </span>
            <span className="text-sm font-medium text-slate-300 truncate" title={metadataLlm.amparo_legal}>
              {metadataLlm.amparo_legal || 'N/A'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Critério
            </span>
            <span className="text-sm font-medium text-slate-300 truncate" title={metadataLlm.criterio_julgamento}>
              {metadataLlm.criterio_julgamento || 'N/A'}
            </span>
          </div>

          <div className="flex flex-col col-span-2 pt-1 mt-1 border-t border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Valor Estimado
            </span>
            <span className="text-[15px] font-bold text-emerald-400">
              {formatCurrency(metadataLlm.valor_estimado)}
            </span>
          </div>

        </div>
      )}

      {/* Botão de Aceitação da Oportunidade */}
      <button
        onClick={handleAcceptTender}
        disabled={isAccepting}
        className={`w-full mt-auto py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex justify-center items-center ${
          isAccepting 
            ? 'bg-blue-600/50 cursor-not-allowed opacity-70' 
            : 'bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-blue-900/20 active:scale-[0.98]'
        }`}
      >
        {isAccepting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            A processar...
          </>
        ) : (
          'Tenho Interesse'
        )}
      </button>

    </div>
  );
};
