import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Copy, FileText, Calendar, CalendarCheck, TrendingUp, ArrowRight, XCircle } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function Financeiro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/financeiro/minha-assinatura/resumo');
      setData(res);
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao buscar informações financeiras.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelar = async () => {
    setCancelling(true);
    try {
      await apiFetch('/financeiro/cancelar-assinatura', { method: 'POST' });
      setShowCancelModal(false);
      setToast({ type: 'success', message: 'Assinatura cancelada com sucesso.' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao cancelar assinatura.' });
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyPix = async (pixKey) => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setToast({ type: 'success', message: 'Chave PIX copiada!' });
    } catch {
      setToast({ type: 'error', message: 'Erro ao copiar chave PIX.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAGA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black">
            <CheckCircle2 size={12} /> PAGA
          </span>
        );
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-black">
            <Clock size={12} /> PENDENTE
          </span>
        );
      case 'ATRASADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-black">
            <AlertCircle size={12} /> ATRASADA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 text-xs font-black">
            {status}
          </span>
        );
    }
  };

  const getHistoricoIcon = (status) => {
    switch (status) {
      case 'PAGA':
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
        );
      case 'PENDENTE':
        return (
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
        );
      case 'ATRASADA':
        return (
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-gray-600" />
          </div>
        );
    }
  };

  const getHistoricoStatusText = (status) => {
    switch (status) {
      case 'PAGA':
        return <span className="text-xs font-bold text-emerald-600">Pago</span>;
      case 'PENDENTE':
        return <span className="text-xs font-bold text-amber-600">Pendente</span>;
      case 'ATRASADA':
        return <span className="text-xs font-bold text-red-600">Atrasada</span>;
      default:
        return <span className="text-xs font-bold text-gray-600">{status}</span>;
    }
  };

  // ─── STATE 1: LOADING ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-gray-500 mt-4">Buscando informações...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE 2: NO SUBSCRIPTION ───────────────────────────────────────
  if (!data || !data.assinatura) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <CreditCard size={36} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Você ainda não possui um plano ativo.</h2>
            <p className="text-sm text-gray-500 font-medium mt-2">
              Assine agora e tenha acesso completo a todos os recursos do Corpo Conectado.
            </p>
            <button
              onClick={() => navigate('/assinatura')}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Conhecer o Plano <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE 3: HAS ACTIVE SUBSCRIPTION ──────────────────────────────
  const { assinatura, mensalidade_atual, historico, stats } = data;

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCancelModal(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center">Cancelar Assinatura?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Ao cancelar, você perderá acesso aos recursos premium do Corpo Conectado ao final do período atual.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 flex-shrink-0 border-b border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <CreditCard className="text-gray-900" size={32} strokeWidth={2.5} /> Minha Assinatura
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Gerencie seu plano e acompanhe seus pagamentos.
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 overflow-y-auto bg-gray-50/50">
        <div className="max-w-3xl mx-auto space-y-8 pt-6">

          {/* ── Card do Plano Ativo ── */}
          <div className="bg-white border-2 border-purple-600 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-purple-600 h-2 w-full"></div>
            <div className="p-5 md:p-6 space-y-4">
              {/* Row 1: Plan name + status */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-gray-900">{assinatura.plano_nome}</span>
                {assinatura.status === 'ATIVA' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ATIVA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-black">
                    <XCircle size={12} />
                    CANCELADA
                  </span>
                )}
              </div>

              {/* Row 2: Price */}
              <div>
                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                  {formatCurrency(assinatura.valor)}
                </span>
                <span className="text-sm font-bold text-gray-400"> /mês</span>
              </div>

              {/* Row 3: Mini info cards */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-gray-50 rounded-xl p-2 md:p-3 text-center flex flex-col items-center justify-center">
                  <CalendarCheck size={14} className="text-gray-400 mb-1" />
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">Início</div>
                  <div className="text-xs md:text-sm font-black text-gray-900 mt-0.5">{formatDate(assinatura.data_inicio)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 md:p-3 text-center flex flex-col items-center justify-center">
                  <Calendar size={14} className="text-gray-400 mb-1" />
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">Vencimento</div>
                  <div className="text-xs md:text-sm font-black text-gray-900 mt-0.5">{formatDate(stats?.proximo_vencimento)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 md:p-3 text-center flex flex-col items-center justify-center">
                  <TrendingUp size={14} className="text-gray-400 mb-1" />
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">Meses</div>
                  <div className="text-xs md:text-sm font-black text-gray-900 mt-0.5">{stats?.meses_assinante ?? 0}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => navigate('/assinatura', { state: { fromFinanceiro: true } })}
                  className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <CreditCard size={14} />
                  Ver planos
                </button>
                
                {assinatura.status === 'ATIVA' && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Cancelar Assinatura
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Mensalidade Atual ── */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Mensalidade Atual</h2>

            {(!mensalidade_atual || mensalidade_atual.status === 'PAGA') ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Tudo Certo!</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Nenhuma cobrança pendente no momento.</p>
                {mensalidade_atual?.status === 'PAGA' && mensalidade_atual.data_pagamento && (
                  <p className="text-xs font-bold text-emerald-600 mt-3">
                    Pago em {formatDate(mensalidade_atual.data_pagamento)}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                {/* LEFT side */}
                <div className="p-6 md:w-1/2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                    {mensalidade_atual.referencia}
                  </p>
                  <div className="mt-2">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      {formatCurrency(mensalidade_atual.valor)}
                    </span>
                  </div>
                  <div className="mt-3">
                    {getStatusBadge(mensalidade_atual.status)}
                  </div>
                  <p className="text-sm text-gray-500 font-medium mt-4">
                    Vencimento: <span className="font-bold text-gray-700">{formatDate(mensalidade_atual.data_vencimento)}</span>
                  </p>
                  {mensalidade_atual.dias_atraso > 0 && (
                    <p className="text-xs font-bold text-red-500 mt-1">
                      {mensalidade_atual.dias_atraso} {mensalidade_atual.dias_atraso === 1 ? 'dia' : 'dias'} em atraso
                    </p>
                  )}
                </div>

                {/* RIGHT side - PIX */}
                <div className="p-6 md:w-1/2 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100">
                  <h4 className="text-sm font-black text-gray-900 mb-4">Pagamento via PIX</h4>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Recebedor</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">Kevin Henrique da Silva Oliveira</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Chave PIX</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 truncate">
                          b33c1dd9-0e16-4731-ac5a-89f3aec755c7
                        </code>
                        <button
                          onClick={() => handleCopyPix('b33c1dd9-0e16-4731-ac5a-89f3aec755c7')}
                          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
                          title="Copiar chave PIX"
                        >
                          <Copy size={14} className="text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-2">
                      Transfira o valor exato de {formatCurrency(mensalidade_atual.valor)} para a chave acima. O pagamento será confirmado automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Histórico de Pagamentos ── */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Histórico de Pagamentos</h2>

            {(!historico || historico.length === 0) ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400 font-medium">Nenhum histórico encontrado.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {historico.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 ${index < historico.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getHistoricoIcon(item.status)}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.referencia}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          {item.data_pagamento ? `Pago em ${formatDate(item.data_pagamento)}` : `Vencimento: ${formatDate(item.data_vencimento)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-black text-gray-900">{formatCurrency(item.valor)}</p>
                      <div className="mt-0.5">{getHistoricoStatusText(item.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
