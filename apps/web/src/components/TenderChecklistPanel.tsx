"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TenderDocument {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  status: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  isMandatory: boolean;
  documents: TenderDocument[];
}

interface TenderChecklistPanelProps {
  tenderId: string;
}

export const TenderChecklistPanel: React.FC<TenderChecklistPanelProps> = ({ tenderId }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, [tenderId]);

  const fetchChecklist = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/tenders/${tenderId}/checklists`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data);
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerUpload = (item: ChecklistItem) => {
    setActiveItem(item);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeItem) return;

    setUploadingId(activeItem.id);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('checklistItemId', activeItem.id);
    formData.append('category', activeItem.category || 'HABILITACAO'); // Fallback seguro

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/tenders/${tenderId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Atualiza a lista para refletir o novo documento e o status 'COMPLETED'
        await fetchChecklist();
      } else {
        alert('Falha ao enviar o documento. Verifica o formato e tamanho.');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro de rede ao enviar o documento.');
    } finally {
      setUploadingId(null);
      setActiveItem(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset do input
    }
  };

  if (isLoading) {
    return <div className="p-6 text-slate-400 animate-pulse">A carregar checklist documental...</div>;
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-xl font-bold text-slate-100">Checklist de Habilitação</h2>
        <p className="text-sm text-slate-400 mt-1">Documentos obrigatórios para participação no certame.</p>
      </div>

      {/* Input de Ficheiro Oculto (Reutilizado por toda a lista) */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".pdf,.zip,.doc,.docx"
      />

      <div className="divide-y divide-slate-800/50">
        {checklist.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum requisito documental gerado para este edital.</div>
        ) : (
          checklist.map((item) => {
            const isCompleted = item.status === 'COMPLETED' || item.documents?.length > 0;

            return (
              <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                
                {/* Info do Requisito */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-200">{item.title}</h3>
                    {item.isMandatory && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-700 text-slate-300">
                        OBRIGATÓRIO
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-slate-400">{item.description}</p>}
                  
                  {/* Ficheiro já enviado */}
                  {isCompleted && item.documents && item.documents[0] && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 w-max px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      {item.documents[0].fileName}
                    </div>
                  )}
                </div>

                {/* Área de Ação */}
                <div className="flex items-center gap-3">
                  {/* Badge de Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${
                    isCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {isCompleted ? '✓ CONCLUÍDO' : 'PENDENTE'}
                  </div>

                  {/* Botão de Upload */}
                  {!isCompleted && (
                    <button
                      onClick={() => handleTriggerUpload(item)}
                      disabled={uploadingId === item.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingId === item.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          A enviar...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          Anexar
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};