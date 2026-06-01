import React from 'react';

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
}

export const TenderCard: React.FC<TenderCardProps> = ({ tender }) => {
  const { title, organization, affinity, metadataLlm } = tender;

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
        <div className="grid grid-cols-2 gap-y-4 gap-x-3 bg-slate-900/80 rounded-lg p-4 border border-slate-700/50 mt-auto">
          
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
    </div>
  );
};
