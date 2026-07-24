import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Search, TrendingUp, Users, AlertCircle, FileText, CheckCircle2, ChevronDown, Clock, Filter, Check, X, RotateCcw, ArrowRight, Plus, Gift, Calendar, Loader2, CreditCard, Timer, AlertTriangle, MoreVertical, CircleDollarSign } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const formatCurrency = (val) => {
  const num = Number(String(val || '0').replace(',', '.'));
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AdminFinanceiro() {
  const [dashboard, setDashboard] = useState({ receitaMes: 0, receitaAno: 0, totalAberto: 0, qtdInadimplentes: 0 });
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmacaoPagamento, setConfirmacaoPagamento] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [novaCobranca, setNovaCobranca] = useState({
    user_id: '',
    valor: '19,90',
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
    referencia: `${new Date().getMonth() + 2}/${new Date().getFullYear()}`.padStart(7, '0')
  });
  const [busca, setBusca] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [filtroAssinatura, setFiltroAssinatura] = useState([]);
  const filterRef = useRef(null);
  const [dropdownAlunoOpen, setDropdownAlunoOpen] = useState(false);
  const dropdownAlunoRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [trialExtend, setTrialExtend] = useState(null);
  const [diasExtras, setDiasExtras] = useState('15');
  const [estendendoTrial, setEstendendoTrial] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
      if (dropdownAlunoRef.current && !dropdownAlunoRef.current.contains(e.target)) setDropdownAlunoOpen(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setOpenActionMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatus = (status) => setFiltroStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  const toggleAssinatura = (status) => setFiltroAssinatura(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);

  const alunosFiltrados = alunos.filter(a => {
    const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(a.status_mensalidade);
    let matchAssinatura = true;
    if (filtroAssinatura.length > 0) {
      if (filtroAssinatura.includes('ATIVA') && a.status_assinatura === 'ATIVA') matchAssinatura = true;
      else if (filtroAssinatura.includes('TRIAL') && a.trial_ativo) matchAssinatura = true;
      else if (filtroAssinatura.includes('EXPIRADO') && !a.trial_ativo && a.status_assinatura !== 'ATIVA') matchAssinatura = true;
      else if (filtroAssinatura.includes('URGENTE') && a.trial_ativo && a.dias_restantes_trial <= 7) matchAssinatura = true;
      else matchAssinatura = false;
    }
    return matchBusca && matchStatus && matchAssinatura;
  });

  // Computed KPIs
  const qtdTrialAtivo = alunos.filter(a => a.trial_ativo).length;

  useEffect(() => { loadData(); }, []);

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

  const handleEstenderTrial = async () => {
    if (!trialExtend || !diasExtras || Number(diasExtras) <= 0) return;
    try {
      setEstendendoTrial(true);
      const result = await apiFetch('/financeiro/admin/trial/estender', {
        method: 'PUT',
        body: JSON.stringify({ userId: trialExtend.userId, diasExtras: Number(diasExtras) })
      });
      setToast({ show: true, message: `Trial de ${trialExtend.nome} estendido até ${formatDate(result.novaDataExpiracao)}`, type: 'success' });
      setTrialExtend(null);
      setDiasExtras('15');
      loadData();
    } catch (err) {
      setToast({ show: true, message: err.message || 'Erro ao estender trial', type: 'error' });
    } finally {
      setEstendendoTrial(false);
    }
  };

  const handleValorChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value) { setNovaCobranca({ ...novaCobranca, valor: '' }); return; }
    const numericValue = parseInt(value, 10) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setNovaCobranca({ ...novaCobranca, valor: formatted });
  };

  const handleNovaCobranca = async (e) => {
    e.preventDefault();
    if (!novaCobranca.user_id) { setToast({ show: true, message: 'Selecione um aluno.', type: 'warning' }); return; }
    try {
      setGerando(true);
      await apiFetch('/financeiro/admin/cobranca', {
        method: 'POST',
        body: JSON.stringify({
          user_id: novaCobranca.user_id,
          valor: Number(String(novaCobranca.valor).replace(/\./g, '').replace(',', '.')),
          data_vencimento: novaCobranca.data_vencimento,
          referencia: novaCobranca.referencia
        })
      });
      setToast({ show: true, message: 'Cobrança gerada com sucesso!', type: 'success' });
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao gerar cobrança.', type: 'error' });
    } finally {
      setGerando(false);
    }
  };

  const executeMarcarPago = async () => {
    if (!confirmacaoPagamento) return;
    try {
      setGerando(true);
      await apiFetch(`/financeiro/admin/cobranca/${confirmacaoPagamento.ultima_mensalidade.id}/pagar`, { method: 'PUT' });
      setToast({ show: true, message: 'Cobrança marcada como paga!', type: 'success' });
      setConfirmacaoPagamento(null);
      loadData();
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Erro ao aprovar pagamento.', type: 'error' });
    } finally {
      setGerando(false);
    }
  };

  // ==============================
  // Helpers de renderização
  // ==============================

  const getStatusLabel = (aluno) => {
    if (aluno.status_assinatura === 'ATIVA') return { text: 'Assinante', color: 'emerald', icon: CheckCircle2 };
    if (aluno.trial_ativo && aluno.dias_restantes_trial <= 7) return { text: `Trial · ${aluno.dias_restantes_trial}d`, color: 'amber', icon: AlertTriangle };
    if (aluno.trial_ativo) return { text: `Trial · ${aluno.dias_restantes_trial}d`, color: 'purple', icon: Gift };
    return { text: 'Expirado', color: 'red', icon: AlertCircle };
  };

  const getPaymentLabel = (aluno) => {
    if (aluno.status_mensalidade === 'PAGA') return { text: 'Em dia', color: 'emerald', icon: CheckCircle2 };
    if (aluno.status_mensalidade === 'PENDENTE') return { text: 'Pendente', color: 'amber', icon: Clock };
    if (aluno.status_mensalidade === 'ATRASADA') return { text: 'Atrasada', color: 'red', icon: AlertCircle };
    return { text: 'Sem cobrança', color: 'gray', icon: null };
  };

  const getTrialProgress = (aluno) => {
    if (aluno.status_assinatura === 'ATIVA' || !aluno.data_expiracao_trial) return 0;
    // Approximate: assume 30 day trial
    const total = 30;
    const used = total - aluno.dias_restantes_trial;
    return Math.min(100, Math.max(0, (used / total) * 100));
  };

  const getCardBorder = (aluno) => {
    if (aluno.status_mensalidade === 'ATRASADA') return 'border-red-200 shadow-red-50';
    if (aluno.trial_ativo && aluno.dias_restantes_trial <= 7) return 'border-amber-200 shadow-amber-50';
    if (!aluno.trial_ativo && aluno.status_assinatura !== 'ATIVA') return 'border-red-100';
    return 'border-gray-100';
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

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
  };

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">

      {/* ===================== HEADER FIXO ===================== */}
      <div className="px-5 lg:px-8 xl:px-10 pt-5 lg:pt-7 pb-4 flex-shrink-0">
        {/* Row 1: Title + Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-lg shadow-gray-900/20">
                <Wallet size={20} />
              </div>
              Gestão Financeira
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-1 ml-[52px] hidden md:block">Visão geral do faturamento, assinaturas e controle de inadimplência.</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão Nova Cobrança */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-gray-800 transition active:scale-95 shadow-md shadow-gray-900/20"
            >
              <Plus size={15} strokeWidth={2.5} /> Cobrança
            </button>

            {/* Botão Filtros */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition shadow-sm whitespace-nowrap ${
                  (filtroStatus.length > 0 || filtroAssinatura.length > 0)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={14} /> Filtros
                {(filtroStatus.length + filtroAssinatura.length) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-black flex items-center justify-center">
                    {filtroStatus.length + filtroAssinatura.length}
                  </span>
                )}
              </button>

              {/* Dropdown Filtros */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-40px)] md:w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Filtros</h3>
                    <button onClick={() => setShowFilters(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pagamento</label>
                      <div className="flex flex-wrap gap-2">
                        {[{v:'PAGA',l:'Paga'},{v:'PENDENTE',l:'Pendente'},{v:'ATRASADA',l:'Atrasada'},{v:'SEM_COBRANCA',l:'Sem Cobrança'}].map(opt => (
                          <button key={opt.v} onClick={() => toggleStatus(opt.v)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                              filtroStatus.includes(opt.v) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {filtroStatus.includes(opt.v) && <Check size={11} className="inline mr-1 -mt-0.5" />}
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assinatura / Trial</label>
                      <div className="flex flex-wrap gap-2">
                        {[{v:'ATIVA',l:'Assinante'},{v:'TRIAL',l:'Em Trial'},{v:'EXPIRADO',l:'Expirado'},{v:'URGENTE',l:'Trial < 7d'}].map(opt => (
                          <button key={opt.v} onClick={() => toggleAssinatura(opt.v)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                              filtroAssinatura.includes(opt.v) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {filtroAssinatura.includes(opt.v) && <Check size={11} className="inline mr-1 -mt-0.5" />}
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <button onClick={() => { setFiltroStatus([]); setFiltroAssinatura([]); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition">
                      <RotateCcw size={13} /> Limpar tudo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-5 border border-gray-100">
          <Search size={18} className="text-gray-400 ml-1 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-medium text-gray-700 text-sm placeholder-gray-400"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </button>
          )}
        </div>

        {/* ===================== KPIs ===================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Receita Mensal */}
          <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm shadow-emerald-50 group hover:shadow-md transition-shadow col-span-2 md:col-span-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <TrendingUp size={64} className="text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-3 w-full relative z-10">
              <p className="text-[10px] md:text-[9px] font-black uppercase tracking-widest text-emerald-600/70">Receita Mensal</p>
              <div className="w-8 h-8 md:w-8 md:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
            </div>
            <p className="text-3xl md:text-xl lg:text-2xl font-black text-gray-900 text-center md:text-left w-full relative z-10">
              R$ {formatCurrency(dashboard.receitaMes)}
            </p>
          </div>
          {/* Receita Anual */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Receita Anual</p>
              <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                <CircleDollarSign size={15} />
              </div>
            </div>
            <p className="text-lg lg:text-xl font-black text-gray-900">R$ {formatCurrency(dashboard.receitaAno)}</p>
          </div>
          {/* Em Aberto */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Em Aberto</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={15} />
              </div>
            </div>
            <p className="text-lg lg:text-xl font-black text-gray-900">R$ {formatCurrency(dashboard.totalAberto)}</p>
          </div>
          {/* Inadimplentes */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Inadimplentes</p>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={15} />
              </div>
            </div>
            <p className="text-lg lg:text-xl font-black text-gray-900">{dashboard.qtdInadimplentes}</p>
          </div>
          {/* Trial Ativo */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Em Trial</p>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Gift size={15} />
              </div>
            </div>
            <p className="text-lg lg:text-xl font-black text-gray-900">{qtdTrialAtivo}</p>
          </div>
        </div>
      </div>

      {/* ===================== CARDS DE ALUNOS ===================== */}
      <div className="flex-1 min-h-0 px-5 lg:px-8 xl:px-10 pb-5 lg:pb-7 overflow-y-auto custom-scrollbar">
        {alunosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">Nenhum atleta encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Ajuste os filtros ou a busca.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alunosFiltrados.map((aluno) => {
              const statusInfo = getStatusLabel(aluno);
              const paymentInfo = getPaymentLabel(aluno);
              const trialProgress = getTrialProgress(aluno);
              const StatusIcon = statusInfo.icon;
              const PayIcon = paymentInfo.icon;
              const sc = colorMap[statusInfo.color];
              const pc = colorMap[paymentInfo.color];
              const isUrgent = aluno.trial_ativo && aluno.dias_restantes_trial <= 7;
              const isExpired = !aluno.trial_ativo && aluno.status_assinatura !== 'ATIVA';

              return (
                <div
                  key={aluno.id}
                  className={`bg-white rounded-2xl border p-3 md:p-4 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300 group ${getCardBorder(aluno)} ${isUrgent ? 'ring-1 ring-amber-200' : ''} ${isExpired ? 'ring-1 ring-red-100' : ''}`}
                >
                  {/* Row Superior — Nome + Ações */}
                  <div className="flex items-start justify-between mb-0 md:mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm shrink-0">
                        {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 truncate mr-1">{aluno.nome}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} border ${sc.border}`}>
                            {StatusIcon && <StatusIcon size={10} />}
                            {statusInfo.text}
                          </span>
                          <span className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${pc.bg} ${pc.text} border ${pc.border}`}>
                            {PayIcon && <PayIcon size={10} />}
                            {paymentInfo.text}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{aluno.email}</p>
                      </div>
                    </div>

                    {/* Menu de ações */}
                    <div className="relative" ref={openActionMenu === aluno.id ? actionMenuRef : null}>
                      <button
                        onClick={() => setOpenActionMenu(openActionMenu === aluno.id ? null : aluno.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openActionMenu === aluno.id && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 animate-fade-in overflow-hidden">
                          <button
                            onClick={() => { setNovaCobranca({ ...novaCobranca, user_id: aluno.id }); setShowModal(true); setOpenActionMenu(null); }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2.5 border-b border-gray-50"
                          >
                            <CreditCard size={14} className="text-gray-400" /> Nova Cobrança
                          </button>
                          {(aluno.status_mensalidade === 'PENDENTE' || aluno.status_mensalidade === 'ATRASADA') && aluno.ultima_mensalidade && (
                            <button
                              onClick={() => { setConfirmacaoPagamento(aluno); setOpenActionMenu(null); }}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-2.5 border-b border-gray-50"
                            >
                              <CheckCircle2 size={14} /> Confirmar Pagamento
                            </button>
                          )}
                          {aluno.status_assinatura !== 'ATIVA' && (
                            <button
                              onClick={() => { setTrialExtend({ userId: aluno.id, nome: aluno.nome }); setOpenActionMenu(null); }}
                              className="w-full text-left px-4 py-3 text-xs font-bold text-purple-700 hover:bg-purple-50 transition flex items-center gap-2.5"
                            >
                              <Gift size={14} /> Estender Trial
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row Inferior — 3 Mini-módulos (Oculto no Mobile) */}
                  <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Módulo 1: Assinatura */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/80">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Assinatura</p>
                      {aluno.status_assinatura === 'ATIVA' ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-bold text-emerald-700">Ativa</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-1">{aluno.plano_nome || 'Plano Básico'} · R$ {formatCurrency(aluno.plano_valor)}/mês</p>
                          {aluno.dia_vencimento && <p className="text-[10px] text-gray-400 mt-0.5">Venc. dia {aluno.dia_vencimento}</p>}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${aluno.trial_ativo ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                            <span className={`text-xs font-bold ${aluno.trial_ativo ? 'text-purple-700' : 'text-gray-500'}`}>
                              {aluno.trial_ativo ? 'Período Gratuito' : 'Sem assinatura'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {aluno.data_expiracao_trial ? `Expira: ${formatDate(aluno.data_expiracao_trial)}` : '—'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Módulo 2: Pagamento */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/80">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Pagamento</p>
                      {aluno.ultima_mensalidade ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                            <span className={`text-xs font-bold ${pc.text}`}>{paymentInfo.text}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-1">R$ {formatCurrency(aluno.ultima_mensalidade.valor)}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Venc: {formatDate(aluno.ultima_mensalidade.vencimento)}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span className="text-xs font-bold text-gray-500">Sem cobranças</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">Nenhuma fatura gerada</p>
                        </div>
                      )}
                    </div>

                    {/* Módulo 3: Trial */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/80">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Período Gratuito</p>
                      {aluno.status_assinatura === 'ATIVA' ? (
                        <div>
                          <span className="text-xs font-bold text-gray-400">N/A</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">Já é assinante</p>
                        </div>
                      ) : aluno.trial_ativo ? (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-lg font-black ${isUrgent ? 'text-amber-600' : 'text-purple-700'}`}>
                              {aluno.dias_restantes_trial}<span className="text-[10px] font-bold ml-0.5">dias</span>
                            </span>
                            {isUrgent && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
                          </div>
                          {/* Barra de progresso */}
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isUrgent ? 'bg-amber-500' : 'bg-purple-500'}`}
                              style={{ width: `${100 - trialProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-red-600">Expirado</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">Desde {formatDate(aluno.data_expiracao_trial)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ação rápida inline para pagamento pendente/atrasado */}
                  {(aluno.status_mensalidade === 'PENDENTE' || aluno.status_mensalidade === 'ATRASADA') && aluno.ultima_mensalidade && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400">
                        Fatura de R$ {formatCurrency(aluno.ultima_mensalidade.valor)} · Ref. {aluno.ultima_mensalidade.referencia || '-'}
                      </p>
                      <button
                        onClick={() => setConfirmacaoPagamento(aluno)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
                      >
                        <Check size={12} strokeWidth={3} /> Confirmar Pgto.
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== MODAL NOVA COBRANÇA ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !gerando && setShowModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-in">
            <div className="relative h-24 bg-gradient-to-r from-gray-900 to-black p-6 flex items-center justify-between overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Wallet className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight leading-none">Nova Cobrança</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1.5">Gerar fatura avulsa para um aluno</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} disabled={gerando} className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleNovaCobranca} className="p-6 space-y-5 bg-gray-50/50">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                    <Users size={12} /> Aluno Destinatário
                  </label>
                  <div className="relative" ref={dropdownAlunoRef}>
                    <div
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all cursor-pointer flex items-center justify-between hover:bg-gray-100/80 ${dropdownAlunoOpen ? 'border-black ring-1 ring-black text-gray-900' : 'border-gray-200 text-gray-900'}`}
                      onClick={() => !gerando && setDropdownAlunoOpen(!dropdownAlunoOpen)}
                    >
                      <span className={novaCobranca.user_id ? 'text-gray-900' : 'text-gray-400 font-normal'}>
                        {novaCobranca.user_id ? alunos.find(a => a.id === novaCobranca.user_id)?.nome : 'Selecione um aluno na lista...'}
                      </span>
                      <ChevronDown size={16} strokeWidth={3} className={`text-gray-400 transition-transform ${dropdownAlunoOpen ? 'rotate-180 text-black' : ''}`} />
                    </div>
                    {dropdownAlunoOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-fade-in custom-scrollbar">
                        {alunos.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400">Nenhum aluno encontrado.</div>
                        ) : alunos.map(a => (
                          <div key={a.id} onClick={() => { setNovaCobranca({ ...novaCobranca, user_id: a.id }); setDropdownAlunoOpen(false); }}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                            <p className="text-sm font-bold text-gray-900">{a.nome}</p>
                            <p className="text-xs text-gray-500 font-medium">{a.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valor Total</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-3 text-sm font-black text-gray-400 group-focus-within:text-black transition-colors">R$</span>
                      <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-black text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all hover:bg-gray-100/80"
                        value={novaCobranca.valor} onChange={handleValorChange} disabled={gerando} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Ref. (Mês)</label>
                    <div className="relative group">
                      <span className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-black transition-colors"><FileText size={16} /></span>
                      <input type="text" placeholder="MM/AAAA" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all hover:bg-gray-100/80"
                        value={novaCobranca.referencia} onChange={(e) => setNovaCobranca({ ...novaCobranca, referencia: e.target.value })} disabled={gerando} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5"><Clock size={12} /> Vencimento</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all hover:bg-gray-100/80 uppercase"
                    value={novaCobranca.data_vencimento} onChange={(e) => setNovaCobranca({ ...novaCobranca, data_vencimento: e.target.value })} disabled={gerando} />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={gerando}
                  className="w-full bg-black text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-black/20">
                  {gerando ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><ArrowRight size={16} /> Gerar Fatura Agora</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL CONFIRMAÇÃO DE PAGAMENTO ===================== */}
      {confirmacaoPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !gerando && setConfirmacaoPagamento(null)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-scale-in flex flex-col">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Confirmar Pagamento</h3>
              <p className="text-sm text-gray-500 font-medium">
                Você confirma que recebeu o pagamento de <strong className="text-gray-900">{confirmacaoPagamento.nome}</strong>?
              </p>
              <p className="text-xs text-emerald-600 font-bold mt-3 bg-emerald-50 p-2 rounded-lg inline-block">
                O acesso será liberado imediatamente.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => setConfirmacaoPagamento(null)} disabled={gerando} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition">Cancelar</button>
              <button onClick={executeMarcarPago} disabled={gerando}
                className="px-5 py-2 bg-emerald-500 text-white text-sm font-black tracking-wide rounded-xl shadow-md hover:bg-emerald-600 transition active:scale-95 flex items-center gap-2">
                {gerando ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : <Check size={16} strokeWidth={3} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL ESTENDER TRIAL ===================== */}
      {trialExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !estendendoTrial && setTrialExtend(null)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-scale-in">
            <div className="relative h-20 bg-gradient-to-r from-purple-600 to-purple-800 p-5 flex items-center gap-3 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <Gift className="text-white" size={18} />
              </div>
              <div className="relative z-10">
                <h3 className="text-base font-black text-white tracking-tight leading-none">Estender Trial</h3>
                <p className="text-purple-200 text-xs font-medium mt-1">{trialExtend.nome}</p>
              </div>
              <button onClick={() => setTrialExtend(null)} disabled={estendendoTrial}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-95">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Dias extras para adicionar</label>
                <div className="flex gap-2">
                  {['7', '15', '30'].map(d => (
                    <button key={d} type="button" onClick={() => setDiasExtras(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-black transition active:scale-95 ${
                        diasExtras === d ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      +{d} dias
                    </button>
                  ))}
                </div>
                <input type="number" min="1" value={diasExtras} onChange={e => setDiasExtras(e.target.value)} placeholder="Ou digite um valor"
                  className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
              </div>
              <button onClick={handleEstenderTrial} disabled={estendendoTrial || !diasExtras || Number(diasExtras) <= 0}
                className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-200">
                {estendendoTrial ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                {estendendoTrial ? 'Estendendo...' : 'Confirmar Extensão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />}
    </div>
  );
}
