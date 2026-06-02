"use client";

import React, { useState } from 'react';

interface TenderAnalysisPanelProps {
  tenderId: string;
}

export const TenderAnalysisPanel: React.FC<TenderAnalysisPanelProps> = ({ tenderId }) => {
  const [formData, setFormData] = useState({
    recommendation: 'GO',
    riskLevel: 'LOW',
    competitionLevel: 'MEDIUM',
    conclusion: '',
    estimatedCost: '',
    suggestedMargin: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/tenders/${tenderId}/analyses/viability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
          suggestedMargin: formData.suggestedMargin ? parseFloat(formData.suggestedMargin) : undefined,
        }),
      });

      if (response.ok) {
        setHasSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Falha ao submeter a análise de viabilidade.');
      }
    } catch (err) {
      console.error('Erro no submit:', err);
      setError('Erro de rede ao submeter o parecer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    const isGo = formData.recommendation === 'GO';
    const isNoGo = formData.recommendation === 'NO_GO';
    const bgColor = isGo ? 'bg-emerald-500/10' : isNoGo ? 'bg-red-500/10' : 'bg-yellow-500/10';
    const borderColor = isGo ? 'border-emerald-500/30' : isNoGo ? 'border-red-500/30' : 'border-yellow-500/30';
    const textColor = isGo ? 'text-emerald-400' : isNoGo ? 'text-red-400' : 'text-yellow-400';

    return (
      <div className={`p-8 rounded-xl border ${bgColor} ${borderColor} shadow-xl flex flex-col items-center justify-center text-center`}>
        <div className={`text-4xl font-black tracking-tight mb-2 ${textColor}`}>
          {formData.recommendation.replace('_', ' ')}
        </div>
        <p className="text-slate-300 max-w-2xl text-lg font-medium">
          Análise de viabilidade concluída com sucesso.
        </p>
        {formData.conclusion && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 w-full text-left">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Parecer Técnico</h4>
            <p className="text-slate-200 text-sm whitespace-pre-wrap">{formData.conclusion}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-xl font-bold text-slate-100">Análise de Viabilidade</h2>
        <p className="text-sm text-slate-400 mt-1">Registe o parecer técnico para GO/NO-GO neste edital.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Coluna 1: Selects de Decisão */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Decisão (Recomendação)</label>
              <select
                name="recommendation"
                value={formData.recommendation}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-bold"
              >
                <option value="GO" className="text-emerald-400 font-bold">GO (Avançar)</option>
                <option value="NO_GO" className="text-red-400 font-bold">NO GO (Declinar)</option>
                <option value="CONDITIONAL" className="text-yellow-400 font-bold">CONDICIONAL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nível de Risco</label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                <option value="LOW">Baixo</option>
                <option value="MEDIUM">Médio</option>
                <option value="HIGH">Alto</option>
                <option value="CRITICAL">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nível de Concorrência</label>
              <select
                name="competitionLevel"
                value={formData.competitionLevel}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          {/* Coluna 2: Inputs Financeiros */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Custo Estimado (R$)</label>
              <input
                type="number"
                step="0.01"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                placeholder="Ex: 50000.00"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Margem Sugerida (%)</label>
              <input
                type="number"
                step="0.01"
                name="suggestedMargin"
                value={formData.suggestedMargin}
                onChange={handleInputChange}
                placeholder="Ex: 15.5"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              />
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong className="text-blue-400 block mb-1">Nota Financeira:</strong>
                O preenchimento dos dados financeiros nesta fase ajudará a balizar o Pipeline de Oportunidades. Estes valores poderão ser ajustados mais tarde na fase de Precificação.
              </p>
            </div>
          </div>
        </div>

        {/* Parecer Técnico */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Parecer Técnico e Conclusão</label>
          <textarea
            name="conclusion"
            value={formData.conclusion}
            onChange={handleInputChange}
            required
            maxLength={2000}
            rows={5}
            placeholder="Justifique a sua decisão com os pontos fortes, fracos, ameaças e oportunidades do edital..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none resize-y"
          ></textarea>
          <div className="text-right mt-1">
            <span className="text-xs text-slate-500">{formData.conclusion.length}/2000</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end pt-4 border-t border-slate-800/50">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                A submeter parecer...
              </>
            ) : (
              'Submeter Análise'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
