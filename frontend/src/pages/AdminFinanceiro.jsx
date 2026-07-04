import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Search, TrendingUp, Users, AlertCircle, FileText, CheckCircle2, ChevronDown, Clock, Filter, Check, X, RotateCcw } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

export default function AdminFinanceiro() {
  const [dashboard, setDashboard] = useState({ receitaMes: 0, receitaAno: 0, totalAberto: 0, qtdInadimplentes: 0 });
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [novaCobranca, setNovaCobranca] = useState({
    user_id: '',
    valor: 19.90, // default requested by user
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0], // next month, day 10
    referencia: `${new Date().getMonth() + 2}/${new Date().getFullYear()}`.padStart(7, '0') // simple string format mm/yyyy
  });
  const [busca, setBusca] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const filterRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatus = (status) => {
    setFiltroStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const alunosFiltrados = alunos.filter(a => {
    const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(a.status_mensalidade);
    return matchBusca && matchStatus;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, alunosData] = await Promise.all([
        apiFetch('/financeiro/admin/dashboard'),
        apiFetch('/financeiro/admin/alunos')
      ]);
      setDashboard(dashData);
      setAlunos(alunosData || []);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao carregar dashboard financeiro.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNovaCobranca = async (e) => {
    e.preventDefault();
    if (!novaCobranca.user_id) {
      setToast({ show: true, message: 'Selecione um aluno.', type: 'warning' });
      return;
    }
    try {
      setGerando(true);
      await apiFetch('/financeiro/admin/cobranca', {
        method: 'POST',
        body: JSON.stringify({
          user_id: novaCobranca.user_id,
          valor: Number(novaCobranca.valor),
          data_vencimento: novaCobranca.data_vencimento,
          referencia: novaCobranca.referencia
        })
      });
      setToast({ show: true, message: 'Cobrança gerada com sucesso!', type: 'success' });
      setShowModal(false);
      loadData(); // refresh data
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao gerar cobrança.', type: 'error' });
    } finally {
      setGerando(false);
    }
  };

  const handleMarcarPago = async (cobrancaId) => {
    if (!window.confirm('Confirma o recebimento desta cobrança? O aluno será liberado imediatamente.')) return;
    try {
      await apiFetch(`/financeiro/admin/cobranca/${cobrancaId}/pagar`, { method: 'PUT' });
      setToast({ show: true, message: 'Cobrança marcada como paga!', type: 'success' });
      loadData();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Erro ao aprovar pagamento.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Buscando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      
      {/* HEADER FIXO */}
      <div className="px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Wallet className="text-gray-900" size={32} strokeWidth={2.5} /> Gestão Financeira
            </h1>
            <p className="text-gray-500 font-medium mt-1">Visão geral do faturamento e controle de inadimplência.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 shadow-md self-start md:self-auto whitespace-nowrap"
            >
              + Nova Cobrança
            </button>
            {/* Botão Filtros */}
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition shadow-sm whitespace-nowrap ${
                  filtroStatus.length > 0 
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} /> Filtros
                {filtroStatus.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                    {filtroStatus.length}
                  </span>
                )}
              </button>

              {/* Dropdown Filtros */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-48px)] md:w-[320px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Filtros</h3>
                    <button onClick={() => setShowFilters(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status da Mensalidade</label>
                    <div className="flex flex-wrap gap-2">
                      {['PAGA', 'PENDENTE', 'ATRASADA', 'SEM_COBRANCA'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => toggleStatus(opt)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                            filtroStatus.includes(opt)
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {filtroStatus.includes(opt) && <Check size={12} className="inline mr-1 -mt-0.5" />}
                          {opt.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <button onClick={() => setFiltroStatus([])} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition">
                      <RotateCcw size={13} /> Limpar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Caixa de Pesquisa */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 mb-5">
          <Search size={20} className="text-gray-400 ml-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar pelo nome ou e-mail de um atleta específico..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-medium text-gray-700 text-sm placeholder-gray-400 p-1"
          />
        </div>

        {/* KPIs (Fixo no topo) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Receita Mensal</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 truncate">R$ {dashboard.receitaMes.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 hidden lg:flex">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Receita Anual</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 truncate">R$ {dashboard.receitaAno.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 hidden lg:flex">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Em Aberto</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 truncate">R$ {dashboard.totalAberto.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 hidden lg:flex">
              <Clock size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Inadimplentes</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 truncate">{dashboard.qtdInadimplentes}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 hidden lg:flex">
              <AlertCircle size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Scrollável */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 xl:px-10 pb-6 lg:pb-8">
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex-shrink-0 overflow-x-auto hidden lg:block">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
                  <th className="px-6 py-4 w-[30%]">Aluno & Contato</th>
                  <th className="px-6 py-4 w-[20%]">Status Mensalidade</th>
                  <th className="px-6 py-4 w-[20%] text-center">Último Valor</th>
                  <th className="px-6 py-4 w-[20%] text-center">Vencimento</th>
                  <th className="px-6 py-4 w-[10%] text-center">Ações</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <tbody className="divide-y divide-gray-100/60">
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold">Nenhum atleta encontrado.</td>
                  </tr>
                ) : (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-gray-50/80 transition-all duration-300">
                      <td className="px-6 py-4 w-[30%]">
                        <div className="font-bold text-gray-900 text-sm">{aluno.nome}</div>
                        <div className="text-xs text-gray-500">{aluno.email}</div>
                      </td>
                      <td className="px-6 py-4 w-[20%]">
                        {aluno.status_mensalidade === 'PAGA' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={12} strokeWidth={3} /> PAGA
                          </span>
                        )}
                        {aluno.status_mensalidade === 'PENDENTE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                            Pendente
                          </span>
                        )}
                        {aluno.status_mensalidade === 'ATRASADA' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={12} strokeWidth={3} /> Atrasada
                          </span>
                        )}
                        {aluno.status_mensalidade === 'SEM_COBRANCA' && (
                          <span className="text-xs text-gray-400 font-medium">Sem cobranças</span>
                        )}
                      </td>
                      <td className="px-6 py-4 w-[20%] text-center text-sm font-bold text-gray-900">
                        {aluno.ultima_mensalidade ? `R$ ${aluno.ultima_mensalidade.valor.toFixed(2).replace('.', ',')}` : '-'}
                      </td>
                      <td className="px-6 py-4 w-[20%] text-center text-xs text-gray-500 font-medium">
                        {aluno.ultima_mensalidade ? new Date(aluno.ultima_mensalidade.vencimento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 w-[10%] text-center">
                        {(aluno.status_mensalidade === 'PENDENTE' || aluno.status_mensalidade === 'ATRASADA') && aluno.ultima_mensalidade && (
                          <button 
                            onClick={() => handleMarcarPago(aluno.ultima_mensalidade.id)}
                            title="Marcar como Pago"
                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center mx-auto transition shadow-sm border border-emerald-100 active:scale-95"
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL NOVA COBRANÇA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !gerando && setShowModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-in">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Nova Cobrança Avulsa</h3>
              <button 
                onClick={() => setShowModal(false)}
                disabled={gerando}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <AlertCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleNovaCobranca} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Aluno</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  value={novaCobranca.user_id}
                  onChange={(e) => setNovaCobranca({ ...novaCobranca, user_id: e.target.value })}
                  disabled={gerando}
                >
                  <option value="">Selecione um aluno...</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    value={novaCobranca.valor}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, valor: e.target.value })}
                    disabled={gerando}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Referência</label>
                  <input 
                    type="text" 
                    placeholder="MM/AAAA"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    value={novaCobranca.referencia}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, referencia: e.target.value })}
                    disabled={gerando}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Vencimento</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  value={novaCobranca.data_vencimento}
                  onChange={(e) => setNovaCobranca({ ...novaCobranca, data_vencimento: e.target.value })}
                  disabled={gerando}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={gerando}
                  className="w-full bg-black text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 disabled:opacity-50 flex justify-center items-center h-12"
                >
                  {gerando ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Gerar Fatura'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />}
    </div>
  );
}
