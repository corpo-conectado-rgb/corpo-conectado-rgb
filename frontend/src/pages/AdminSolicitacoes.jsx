import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Search, User, Filter, XCircle, X, Trash2, ArrowRight, AlertTriangle, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

export default function AdminSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDENTE'); // 'PENDENTE', 'APROVADA', 'RECUSADA', 'TODAS'
  const navigate = useNavigate();

  // Estado do Modal de Ação (Aprovar/Recusar)
  const [actionModal, setActionModal] = useState({ show: false, id: null, type: null }); // type: 'aprovar' | 'recusar'
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, nome: '' });
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/solicitacoes/admin');
      setSolicitacoes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmarAcao = async (e) => {
    e.preventDefault();
    if (!actionModal.id || !actionModal.type) return;

    try {
      setSubmitting(true);
      await apiFetch(`/solicitacoes/admin/${actionModal.id}/${actionModal.type}`, {
        method: 'PUT',
        body: JSON.stringify({ observacao })
      });
      
      const novoStatus = actionModal.type === 'aprovar' ? 'APROVADA' : 'RECUSADA';

      setSolicitacoes(prev => prev.map(s => 
        s.id === actionModal.id ? { ...s, status: novoStatus, data_resolucao: new Date().toISOString(), observacao_admin: observacao } : s
      ));
      
      fecharModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fecharModal = () => {
    setActionModal({ show: false, id: null, type: null });
    setObservacao('');
  };

  const fecharDeleteModal = () => {
    setDeleteModal({ show: false, id: null, nome: '' });
  };

  const deletarSolicitacao = async () => {
    if (!deleteModal.id) return;
    try {
      setSubmitting(true);
      await apiFetch(`/solicitacoes/admin/${deleteModal.id}`, { method: 'DELETE' });
      setSolicitacoes(prev => prev.filter(s => s.id !== deleteModal.id));
      fecharDeleteModal();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(s => {
    if (filter === 'TODAS') return true;
    return s.status === filter;
  });

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'IMPLEMENTACAO': return 'Implementação';
      case 'FINANCEIRO': return 'Financeiro';
      case 'FICHA': return 'Ficha';
      case 'EXECUCAO': return 'Execução';
      case 'APLICATIVO': return 'Aplicativo';
      case 'ALTERACAO_DADOS': return 'Alteração de Dados';
      case 'PAGAMENTO_REALIZADO': return 'Pagamento Realizado';
      default: return tipo;
    }
  };

  const getTipoStyle = (tipo) => {
    switch (tipo) {
      case 'IMPLEMENTACAO': return 'bg-blue-50 text-blue-600 border-blue-200/50';
      case 'FINANCEIRO': return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
      case 'FICHA': return 'bg-purple-50 text-purple-600 border-purple-200/50';
      case 'EXECUCAO': return 'bg-amber-50 text-amber-600 border-amber-200/50';
      case 'APLICATIVO': return 'bg-indigo-50 text-indigo-600 border-indigo-200/50';
      case 'ALTERACAO_DADOS': return 'bg-orange-50 text-orange-600 border-orange-200/50';
      case 'PAGAMENTO_REALIZADO': return 'bg-green-50 text-green-600 border-green-200/50';
      default: return 'bg-gray-50 text-gray-600 border-gray-200/50';
    }
  };

  // Tenta parsear o JSON de ALTERACAO_DADOS
  const parseAlteracaoDados = (mensagem) => {
    try {
      const data = JSON.parse(mensagem);
      return data.alteracoes || [];
    } catch {
      return null;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Caixa de Entrada <span className="flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-6 px-2.5 font-bold shadow-sm">{solicitacoes.filter(s => s.status === 'PENDENTE').length}</span>
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Gerencie os pedidos, dúvidas e reavaliações dos seus alunos.
            </p>
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {['PENDENTE', 'APROVADA', 'RECUSADA', 'TODAS'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs lg:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f === 'PENDENTE' ? 'Pendentes' : f === 'APROVADA' ? 'Aprovadas' : f === 'RECUSADA' ? 'Recusadas' : 'Todas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 lg:pb-8 overflow-y-auto bg-gray-50/50">
        <div className="max-w-4xl mx-auto xl:max-w-6xl py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : filteredSolicitacoes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <Mail className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-black text-gray-900">Nenhuma solicitação {filter.toLowerCase()}</h3>
              <p className="text-sm text-gray-500 font-medium">Sua caixa de entrada está limpa!</p>
            </div>
          ) : (
            filteredSolicitacoes.map(sol => (
              <div key={sol.id} className={`group relative bg-white rounded-2xl border ${sol.status === 'PENDENTE' ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-75'} p-4 md:p-5 transition-all`}>
                {/* Ícone de Excluir absoluto no canto superior direito */}
                <button 
                  onClick={() => setDeleteModal({ show: true, id: sol.id, nome: sol.aluno_nome || 'Aluno' })} 
                  className="absolute top-3 right-3 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full" 
                  title="Excluir Solicitação"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shadow-sm shrink-0 ${sol.tipo === 'PAGAMENTO_REALIZADO' ? 'bg-gradient-to-tr from-green-100 to-emerald-50 border border-green-200 text-green-600' : 'bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 text-gray-600'}`}>
                      {sol.tipo === 'PAGAMENTO_REALIZADO' ? <Banknote size={20} /> : sol.aluno_nome ? sol.aluno_nome.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-gray-900">{sol.aluno_nome || 'Aluno'}</h3>
                          <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border ${getTipoStyle(sol.tipo)}`}>
                            {getTipoLabel(sol.tipo)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-400 mb-3">
                        Enviado em {formatDate(sol.data_criacao)}
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 mb-2">
                        {sol.tipo === 'ALTERACAO_DADOS' ? (() => {
                          const alteracoes = parseAlteracaoDados(sol.mensagem);
                          if (!alteracoes) return sol.mensagem;
                          return (
                            <div className="space-y-2">
                              {alteracoes.map((alt, idx) => (
                                <div key={idx} className={`flex items-center gap-3 rounded-lg p-2.5 border ${alt.impacta_prescricao ? 'bg-red-50/40 border-red-100' : 'bg-white border-gray-100'}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{alt.label}</span>
                                      {alt.impacta_prescricao && (
                                        <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-0.5">
                                          <AlertTriangle size={8} /> Impacta Treino
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-400 line-through truncate">{alt.de || 'Vazio'}</span>
                                      <ArrowRight size={12} className="text-orange-500 shrink-0" />
                                      <span className="text-xs font-black text-orange-700 truncate">{alt.para}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })() : sol.mensagem}
                      </div>
                      {/* Observação do Admin se houver */}
                      {(sol.status === 'APROVADA' || sol.status === 'RECUSADA') && sol.observacao_admin && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Sua Observação</span>
                          <p className="text-xs text-gray-600 italic">"{sol.observacao_admin}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center justify-start md:justify-end gap-2 shrink-0 md:pl-4 md:border-l border-gray-100 md:w-36 lg:w-44 pt-6 md:pt-8">
                    <button 
                      onClick={() => navigate(`/admin/prescricao/${sol.aluno_id}`)}
                      className="px-4 py-2 w-full text-[10px] font-black uppercase tracking-wider bg-black text-white rounded-xl hover:bg-gray-800 transition active:scale-95 text-center"
                    >
                      Ir para Ficha
                    </button>
                    {sol.status === 'PENDENTE' ? (
                      <>
                        {sol.tipo === 'PAGAMENTO_REALIZADO' && (
                          <button 
                            onClick={() => navigate('/admin/financeiro')}
                            className="px-4 py-2 w-full flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100 rounded-xl hover:bg-green-500 hover:text-white transition active:scale-95"
                          >
                            <Banknote size={14} /> Confirmar Recebimento
                          </button>
                        )}
                        <button 
                          onClick={() => setActionModal({ show: true, id: sol.id, type: 'aprovar' })}
                          className="px-4 py-2 w-full flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white transition active:scale-95"
                        >
                          <CheckCircle size={14} /> Aprovar
                        </button>
                        <button 
                          onClick={() => setActionModal({ show: true, id: sol.id, type: 'recusar' })}
                          className="px-4 py-2 w-full flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition active:scale-95"
                        >
                          <XCircle size={14} /> Recusar
                        </button>
                      </>
                    ) : (
                      <div className={`px-4 py-2 w-full flex justify-center items-center gap-1.5 text-xs font-black uppercase tracking-wider ${sol.status === 'APROVADA' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {sol.status === 'APROVADA' ? <><CheckCircle size={14} /> Aprovada</> : <><XCircle size={14} /> Recusada</>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Ação (Aprovar/Recusar) */}
      {actionModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={fecharModal} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {actionModal.type === 'aprovar' ? 'Aprovar Solicitação' : 'Recusar Solicitação'}
              </h3>
              <button onClick={fecharModal} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={confirmarAcao} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
                  Observação para o Aluno
                </label>
                <textarea 
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Escreva uma observação (ex: Treino alterado conforme pedido. Boa sorte!)"
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black resize-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting || !observacao.trim()}
                className={`w-full text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl mt-2 disabled:opacity-50 active:scale-95 transition-all
                  ${actionModal.type === 'aprovar' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {submitting ? 'Confirmando...' : 'Confirmar Ação'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={fecharDeleteModal} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden text-center p-6">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Solicitação?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Você está prestes a excluir a solicitação de <span className="font-bold text-gray-900">{deleteModal.nome}</span>. Esta ação apagará a mensagem permanentemente e não poderá ser desfeita.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={deletarSolicitacao}
                disabled={submitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
              >
                {submitting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
              <button 
                onClick={fecharDeleteModal}
                disabled={submitting}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
