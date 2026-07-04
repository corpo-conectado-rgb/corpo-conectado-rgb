import React, { useState, useEffect } from 'react';
import { Wallet, FileText, CheckCircle2, Clock, AlertCircle, Copy, X } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

export default function Financeiro() {
  const [mensalidade, setMensalidade] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mensalidadeData, historicoData] = await Promise.all([
        apiFetch('/financeiro/minha-mensalidade'),
        apiFetch('/financeiro/historico')
      ]);
      setMensalidade(mensalidadeData);
      setHistorico(historicoData || []);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao carregar dados financeiros.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ show: true, message: 'Copiado para a área de transferência!', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Buscando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* HEADER */}
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 flex-shrink-0 border-b border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Wallet className="text-gray-900" size={32} strokeWidth={2.5} /> Financeiro
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Gerencie suas mensalidades e pagamentos.
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 overflow-y-auto bg-gray-50/50">
        <div className="max-w-4xl mx-auto xl:max-w-5xl py-6 space-y-6">
          
          {/* MENSALIDADE ATUAL */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Mensalidade Atual</h2>
            
            {!mensalidade ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Tudo Certo!</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Você não possui nenhuma cobrança ativa no momento.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                {/* INFO */}
                <div className="p-6 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-500">Ref: {mensalidade.referencia}</span>
                      
                      {mensalidade.status === 'PAGA' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black">
                          <CheckCircle2 size={12} strokeWidth={3} /> PAGA
                        </span>
                      )}
                      {mensalidade.status === 'PENDENTE' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-black">
                          <Clock size={12} strokeWidth={3} /> PENDENTE
                        </span>
                      )}
                      {mensalidade.status === 'ATRASADA' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-black animate-pulse">
                          <AlertCircle size={12} strokeWidth={3} /> ATRASADA
                        </span>
                      )}
                    </div>
                    
                    <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">
                      R$ {Number(mensalidade.valor || 0).toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      Vencimento: <span className="text-gray-900 font-bold">{new Date(mensalidade.data_vencimento).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>

                  {mensalidade.status === 'PAGA' && (
                    <div className="mt-6 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Pago em</span>
                      <span className="text-sm font-black text-gray-900">{new Date(mensalidade.data_pagamento).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {/* PAGAMENTO (PIX MANUAL) */}
                {mensalidade.status !== 'PAGA' && (
                  <div className="p-6 md:w-1/2 bg-gray-50/50 flex flex-col items-center justify-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 text-center">Pagamento via PIX</h4>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 w-full text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Recebedor</p>
                      <p className="text-sm font-black text-gray-900 mb-4">Kevin Henrique da Silva Oliveira</p>
                      
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block text-left">Chave PIX (Aleatória)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value="b33c1dd9-0e16-4731-ac5a-89f3aec755c7"
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 outline-none truncate"
                        />
                        <button 
                          onClick={() => handleCopy('b33c1dd9-0e16-4731-ac5a-89f3aec755c7')}
                          className="bg-black text-white px-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                          title="Copiar chave PIX"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">
                      Transfira exatamente o valor da mensalidade para a chave acima. O seu acesso será liberado assim que o administrador confirmar o recebimento.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* HISTORICO */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Histórico de Pagamentos</h2>
            
            {historico.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 font-medium">
                Nenhum histórico encontrado.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {historico.map((item, idx) => (
                  <div key={item.id} className={`flex items-center justify-between p-4 ${idx !== historico.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.status === 'PAGA' ? 'bg-emerald-50 text-emerald-600' : 
                        item.status === 'ATRASADA' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.referencia}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {item.status === 'PAGA' ? `Pago em ${new Date(item.data_pagamento).toLocaleDateString('pt-BR')}` : `Vence em ${new Date(item.data_vencimento).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">R$ {Number(item.valor || 0).toFixed(2).replace('.', ',')}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                        item.status === 'PAGA' ? 'text-emerald-600' : 
                        item.status === 'ATRASADA' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: '' })} 
        />
      )}
    </div>
  );
}
