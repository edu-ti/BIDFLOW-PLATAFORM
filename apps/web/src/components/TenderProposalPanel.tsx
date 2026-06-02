"use client";

import React, { useState } from 'react';

interface TenderProposalPanelProps {
  tenderId: string;
}

export const TenderProposalPanel: React.FC<TenderProposalPanelProps> = ({ tenderId }) => {
  const [formData, setFormData] = useState({
    totalValue: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.totalValue || isNaN(Number(formData.totalValue))) {
      setError('Por favor, introduza um valor final válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/tenders/${tenderId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalValue: parseFloat(formData.totalValue),
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        setHasSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Falha ao submeter a proposta comercial.');
      }
    } catch (err) {
      console.error('Erro no submit da proposta:', err);
      setError('Erro de rede ao submeter a proposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.totalValue));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const downloadUrl = `${apiUrl}/v1/tenders/${tenderId}/proposals/pdf`;

    return (
      <div className="p-8 rounded-xl border bg-emerald-500/10 border-emerald-500/30 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div className="text-3xl font-black tracking-tight mb-2 text-emerald-400">
          Proposta Registada: {formattedValue}
        </div>
        <p className="text-slate-300 max-w-xl text-md font-medium mt-2 leading-relaxed">
          A proposta comercial foi submetida com sucesso ao sistema. <br/>
          A Oportunidade correspondente no módulo CRM foi automaticamente movida para o funil de <span className="text-emerald-400 font-bold">NEGOCIAÇÃO</span>.
        </p>
        
        <div className="mt-8">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download="Proposta_Comercial.pdf"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Baixar Proposta Oficial (PDF)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-xl font-bold text-slate-100">Proposta Comercial</h2>
        <p className="text-sm text-slate-400 mt-1">Insira os valores da proposta final para avançar este edital para a fase de negociação.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6 mb-6">
          {/* Campo de Valor Final (Destaque) */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Valor Total da Proposta (R$)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 text-2xl font-bold">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                className="w-full pl-14 bg-slate-800 border-2 border-slate-700 text-emerald-400 text-3xl font-black rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-4 outline-none transition-colors"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Este valor atualizará o total estimado da oportunidade no CRM de Vendas.</p>
          </div>

          {/* Parecer / Observações Comerciais */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Observações Comerciais (Opcional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              maxLength={1500}
              rows={4}
              placeholder="Ex: Condições de pagamento diferenciadas, impostos incluídos, exclusões..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 outline-none resize-y transition-colors"
            ></textarea>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end pt-5 border-t border-slate-800/50">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                A enviar...
              </>
            ) : (
              'Submeter Proposta Oficial'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
