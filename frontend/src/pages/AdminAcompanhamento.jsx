import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, TrendingUp, ShieldCheck, Clock, 
  Search, RefreshCw, Calendar, ArrowUpRight, Flame, Trophy, 
  Dumbbell, UserCheck, UserX, BarChart3, ChevronRight, Weight, X, ExternalLink, Phone, Mail, Award, Filter, ChevronDown, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, LabelList 
} from 'recharts';
import { apiFetch } from '../services/api';

// Paleta de cores moderna e executiva para o gráfico de Rosca (Eficiência)
const EMERALD_COLORS = ['#059669', '#10b981', '#14b8a6', '#0f766e', '#34d399'];

// Componente Tooltip Executivo no estilo Power BI (com sombreamento, ícones e tipografia nítida)
const PowerBITooltip = ({ active, payload, color = '#8b5cf6', unit = '' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-gray-100 shadow-xl shadow-slate-900/10 transition-all z-50">
        <div className="flex items-center gap-2 mb-1 border-b border-gray-100 pb-1">
          <span className="text-sm font-black">{data.rankIcon || '🏅'}</span>
          <span className="text-xs font-black text-gray-900">{data.nome}</span>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-black text-gray-800">{data.label || `${data.valor} ${unit}`}</span>
          {data.totalTreinos > 0 && (
            <span className="text-[11px] font-semibold text-gray-400">({data.totalTreinos} treinos)</span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Helper para truncar nomes com elegância em rótulos de eixos dos gráficos
const formatShortName = (fullName) => {
  if (!fullName) return 'Al.';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};


export default function AdminAcompanhamento() {
  const [activeTab, setActiveTab] = useState('alunos'); // 'alunos' | 'dashboard'
  const [alunos, setAlunos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisco, setFilterRisco] = useState('TODOS'); // 'TODOS' | 'ENGAJADOS' | 'ALERTA' | 'RISCO_ABANDONO' | 'TRIAL'
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para o Drawer/Modal de Detalhes do Aluno
  const [selectedAluno, setSelectedAluno] = useState(null);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alunosRes, dashRes] = await Promise.all([
        apiFetch('/admin/acompanhamento-alunos'),
        apiFetch('/admin/dashboard-gerencial')
      ]);
      if (alunosRes) setAlunos(alunosRes);
      if (dashRes) setDashboard(dashRes);
    } catch (error) {
      console.error('Erro ao carregar dados de acompanhamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper para formatar números com vírgula no padrão brasileiro
  const formatNumBr = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return String(val).replace('.', ',');
  };

  // Helper para converter data BR (DD/MM/YYYY) ou ISO sem inverter dia e mês no navegador
  const parseDateSafe = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    if (s.includes('/')) {
      const parts = s.split(/[,\s]+/);
      const dataPart = parts[0];
      const horaPart = parts[1] || '00:00:00';
      const [dia, mes, ano] = dataPart.split('/');
      if (dia && mes && ano) {
        const d = new Date(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaPart}`);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };


  // Helper de formatação humanizada de Último Treino (Hoje, Ontem, Há X dias)
  const formatTreinoHuman = (dias, dateStr) => {
    if (dias === null || !dateStr) return 'Sem treinos';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    return `Há ${dias} dias`;
  };

  const filteredAlunos = alunos.filter(a => {
    const matchSearch = a.nome?.toLowerCase().includes(search.toLowerCase()) || 
                        a.email?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    
    if (filterRisco === 'ENGAJADOS') return a.statusEngajamento === 'ENGAJADO';
    if (filterRisco === 'ALERTA') return a.statusEngajamento === 'ALERTA';
    if (filterRisco === 'RISCO_ABANDONO') return a.statusEngajamento === 'RISCO_ABANDONO';
    if (filterRisco === 'TRIAL') return a.statusPlano === 'TRIAL';
    return true;
  });

  return (
    <div className="absolute inset-0 z-10 bg-slate-50 flex flex-col overflow-hidden animate-fade-in">
      {/* Cabeçalho Fixo */}
      <div className="px-6 lg:px-10 pt-6 pb-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Activity className="text-purple-600" size={32} />
            Acompanhamento de Alunos
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Supervisão ágil de engajamento, retenção e inteligência analítica de alunos
          </p>
        </div>

        {/* Botões de Navegação entre Abas - Elegantes, com texto e sem corte de tooltips */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('alunos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'alunos' 
                ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Users size={18} />
            <span>Alunos</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 size={18} />
            <span>Dashboard BI</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal Rolável */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
            <RefreshCw size={40} className="animate-spin text-purple-600" />
            <p className="font-bold text-sm">Carregando métricas em tempo real...</p>
          </div>
        ) : activeTab === 'alunos' ? (
          /* ==============================================================
           * ABA 1: ACOMPANHAMENTO DE ALUNOS (REDESIGN: CARDS HORIZONTAIS)
           * ============================================================== */
          <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* Barra de Controles: Pesquisa e Botão Suspenso de Filtros */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              {/* Menu suspenso de Filtro Rápido */}
              <div className="relative w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full md:w-auto flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-sm font-bold border transition shadow-2xs ${
                    filterRisco !== 'TODOS' || showFilters
                      ? 'bg-[var(--color-noir-navy)] text-white border-[var(--color-noir-navy)]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Filter size={16} className={filterRisco !== 'TODOS' ? 'text-purple-400' : 'text-gray-400'} />
                    <span>Filtro: <strong className="font-black text-xs uppercase tracking-wider">{[
                      { id: 'TODOS', label: 'Todos' },
                      { id: 'ENGAJADOS', label: 'Engajados' },
                      { id: 'ALERTA', label: 'Em Alerta' },
                      { id: 'RISCO_ABANDONO', label: 'Risco Abandono' },
                      { id: 'TRIAL', label: 'Trial' }
                    ].find(f => f.id === filterRisco)?.label}</strong></span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Flutuante de Opções de Filtro */}
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 mt-2 w-full md:w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 z-20 space-y-1 animate-scale-up">
                      {[
                        { id: 'TODOS', label: 'Todos os Alunos' },
                        { id: 'ENGAJADOS', label: '🟢 Engajados' },
                        { id: 'ALERTA', label: '🟡 Em Alerta (4+ dias)' },
                        { id: 'RISCO_ABANDONO', label: '🔴 Risco Abandono' },
                        { id: 'TRIAL', label: '🕒 Trial / Em Teste' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => {
                            setFilterRisco(btn.id);
                            setShowFilters(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${
                            filterRisco === btn.id
                              ? 'bg-[var(--color-noir-navy)] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{btn.label}</span>
                          {filterRisco === btn.id && <Check size={16} className="text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Lista Vertical de Cards Horizontais (1 aluno por card) */}
            {filteredAlunos.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400 font-bold">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="flex flex-col space-y-3.5">
                {filteredAlunos.map(a => {
                  const isGain = a.variacaoKg > 0;
                  const isStable = Math.abs(a.variacaoKg) < 0.1;

                  return (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAluno(a)}
                      className="bg-white hover:bg-purple-50/20 rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 group"
                    >
                      {/* Coluna 1: Nome e Email */}
                      <div className="w-full lg:w-4/12 min-w-[250px] pr-2">
                        <h3 className="text-base font-black text-gray-900 tracking-tight group-hover:text-purple-700 transition line-clamp-1">
                          {a.nome}
                        </h3>
                        <span className="text-xs font-semibold text-gray-400 block mt-0.5 line-clamp-1">
                          {a.email}
                        </span>
                      </div>

                      {/* Colunas Centrais: 3 Indicadores Horizontais (Treino, Frequência e Peso) */}
                      <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8 flex-1 w-full border-t border-b lg:border-y-0 border-gray-100 py-3 lg:py-0">
                        
                        {/* 1. Treino */}
                        <div>
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">
                            Treino
                          </span>
                          <span className={`text-sm font-black truncate block ${a.diasSemTreinar > 7 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatTreinoHuman(a.diasSemTreinar, a.ultimoTreino)}
                          </span>
                        </div>

                        {/* 2. Frequência */}
                        <div>
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">
                            Frequência
                          </span>
                          <span className="text-sm font-black text-gray-900 truncate block">
                            {a.freqSemana || 0}x semana
                          </span>
                        </div>

                        {/* 3. Peso */}
                        <div>
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">
                            Peso
                          </span>
                          <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-sm font-black text-gray-900">
                              {formatNumBr(a.pesoAtual)} kg
                            </span>
                            {!isStable && (
                              <span className="text-xs font-semibold text-gray-500">
                                ({isGain ? `+${formatNumBr(a.variacaoKg)}` : `${formatNumBr(a.variacaoKg)}`})
                              </span>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Botão à direita */}
                      <div className="flex items-center justify-end w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-all bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                          <span>Ver detalhes</span>
                          <span className="text-sm leading-none group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ==============================================================
           * ABA 2: DASHBOARD GERENCIAL DE BI
           * ============================================================== */
          dashboard && (
            <div className="space-y-10 max-w-7xl mx-auto pb-8">
              
              {/* BLOCO 1: INDICADORES EXECUTIVOS DE BASE & RETENÇÃO */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">
                      Métricas Gerais de Alunos
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100/70 ml-1">
                      Em tempo real
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  {/* Card 1: Total de Alunos */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">Total de Alunos</span>
                        <div className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight my-1.5">
                          {dashboard.base.totalAlunos}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/60 group-hover:scale-105 transition-transform">
                        <Users size={22} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-gray-500">Base ativa cadastrada</span>
                    </div>
                  </div>

                  {/* Card 2: Alunos Assinantes */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">Alunos Assinantes</span>
                        <div className="text-3xl lg:text-4xl font-black text-purple-700 tracking-tight my-1.5">
                          {dashboard.base.totalAtivos}
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60 group-hover:scale-105 transition-transform">
                        <UserCheck size={22} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 mt-2">
                      <span className="text-xs font-medium text-purple-700/80 font-semibold">Com plano pago ativo</span>
                    </div>
                  </div>

                  {/* Card 3: Em Período de Teste */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">Em Período de Teste</span>
                        <div className="text-3xl lg:text-4xl font-black text-sky-600 tracking-tight my-1.5">
                          {dashboard.base.totalTrial}
                        </div>
                      </div>
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/60 group-hover:scale-105 transition-transform">
                        <Clock size={22} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 mt-2">
                      <span className="text-xs font-medium text-gray-500">Aproveitando o Trial</span>
                    </div>
                  </div>

                  {/* Card 4: Treinos Hoje (Card Destaque Executivo) */}
                  <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 rounded-2xl border border-emerald-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-4 relative">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block mb-1 uppercase tracking-wide">Treinos Hoje</span>
                        <div className="text-3xl lg:text-4xl font-black text-emerald-600 tracking-tight my-1.5">
                          {dashboard.engajamento?.treinaramHoje || 0}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                        <Dumbbell size={22} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-100 mt-2 relative">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700">Sessões concluídas hoje</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* BLOCO 2: INTELIGÊNCIA ANALÍTICA & RANKINGS (POWER BI STYLE) */}
              {dashboard.top5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                      <h2 className="text-base font-bold text-gray-900 tracking-tight">
                        Top 5 Destaques & Desempenho
                      </h2>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100/70 ml-1">
                        Inteligência Analítica
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* TOP 1: Constância no Mês */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs hover:shadow-md hover:border-gray-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100/60">
                              <Dumbbell size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Treinos no Mês</h3>
                              <span className="text-xs text-gray-500 font-medium block mt-0.5">Maior constância de sessões no período corrente</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200/60">Mês Atual</span>
                        </div>

                        {(!dashboard.top5.treinosMes || dashboard.top5.treinosMes.length === 0) ? (
                          <div className="py-12 text-center text-gray-400 font-medium text-sm">
                            Nenhum treino registrado neste mês.
                          </div>
                        ) : (
                          <div className="h-[250px] w-full pt-4">
                            {(() => {
                              const chartData = dashboard.top5.treinosMes.map((item, i) => ({
                                ...item,
                                shortName: formatShortName(item.nome),
                                rankIcon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                              }));
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 25, right: 10, left: -25, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="pbiPurple" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                    <YAxis stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip content={<PowerBITooltip color="#8b5cf6" />} cursor={{ fill: 'rgba(139, 92, 246, 0.04)', radius: 6 }} />
                                    <Bar dataKey="valor" fill="url(#pbiPurple)" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" maxBarSize={38}>
                                      <LabelList dataKey="valor" position="top" fill="#475569" fontSize={12} fontWeight={700} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 2: Frequência Consecutiva */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs hover:shadow-md hover:border-gray-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500 border border-amber-100/60">
                              <Flame size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Frequência Consecutiva</h3>
                              <span className="text-xs text-gray-500 font-medium block mt-0.5">Sequência de consistência ininterrupta (Streak)</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">Streak Ativo</span>
                        </div>

                        {(!dashboard.top5.streak || dashboard.top5.streak.length === 0) ? (
                          <div className="py-12 text-center text-gray-400 font-medium text-sm">
                            Nenhum aluno com sequência consecutiva ativa.
                          </div>
                        ) : (
                          <div className="h-[250px] w-full">
                            {(() => {
                              const chartData = dashboard.top5.streak.map((item, i) => ({
                                ...item,
                                shortName: `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`} ${formatShortName(item.nome)}`,
                                rankIcon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                              }));
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 115, left: 5, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="pbiOrange" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.85} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="shortName" type="category" stroke="#334155" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={115} />
                                    <Tooltip content={<PowerBITooltip color="#f97316" />} cursor={{ fill: 'rgba(249, 115, 22, 0.04)', radius: 6 }} />
                                    <Bar dataKey="valor" fill="url(#pbiOrange)" radius={[0, 6, 6, 0]} animationDuration={1400} animationEasing="ease-out" barSize={20} label={{ position: 'right', fill: '#d97706', fontSize: 11, fontWeight: 700, formatter: (val, item) => (item && item.payload ? item.payload.label : val) }} />
                                  </BarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 3: Volume Total Movimentado no Mês */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs hover:shadow-md hover:border-gray-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/60">
                              <BarChart3 size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Volume de Carga no Mês</h3>
                              <span className="text-xs text-gray-500 font-medium block mt-0.5">Total de carga mecânica movimentada (kg / toneladas)</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">Evolução Carga</span>
                        </div>

                        {(!dashboard.top5.volumeMes || dashboard.top5.volumeMes.length === 0) ? (
                          <div className="py-12 text-center text-gray-400 font-medium text-sm">
                            Nenhum volume de treino registrado neste mês.
                          </div>
                        ) : (
                          <div className="h-[250px] w-full pt-2">
                            {(() => {
                              const chartData = dashboard.top5.volumeMes.map((item, i) => ({
                                ...item,
                                shortName: formatShortName(item.nome),
                                rankIcon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                              }));
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 20, right: 15, left: -15, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="pbiBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.75} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                    <YAxis stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}t` : v} />
                                    <Tooltip content={<PowerBITooltip color="#0284c7" />} />
                                    <Area type="monotone" dataKey="valor" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#pbiBlue)" dot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: '#0284c7' }} activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2, fill: '#0369a1' }} animationDuration={1500} animationEasing="ease-in-out" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 4: Eficiência de Conclusão */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs hover:shadow-md hover:border-gray-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/60">
                              <Award size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Eficiência nos Treinos</h3>
                              <span className="text-xs text-gray-500 font-medium block mt-0.5">% de exercícios concluídos vs prescritos na ficha</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">Meta vs Conclusão</span>
                        </div>

                        {(!dashboard.top5.eficiencia || dashboard.top5.eficiencia.length === 0) ? (
                          <div className="py-12 text-center text-gray-400 font-medium text-sm">
                            Nenhuma sessão concluída para avaliar eficiência.
                          </div>
                        ) : (
                          <div>
                            {(() => {
                              const chartData = dashboard.top5.eficiencia.map((item, i) => ({
                                ...item,
                                shortName: formatShortName(item.nome),
                                rankIcon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                              }));
                              return (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-5 h-auto min-h-[250px]">
                                  <div className="w-full sm:w-[160px] md:w-[175px] h-[190px] shrink-0 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Tooltip content={<PowerBITooltip color="#059669" unit="%" />} />
                                        <Pie
                                          data={chartData}
                                          dataKey="valor"
                                          nameKey="shortName"
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={46}
                                          outerRadius={72}
                                          paddingAngle={4}
                                          stroke="none"
                                          animationDuration={1400}
                                        >
                                          {chartData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={EMERALD_COLORS[idx % EMERALD_COLORS.length]} className="hover:opacity-85 transition-opacity duration-200 cursor-pointer" />
                                          ))}
                                        </Pie>
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  
                                  {/* Tabela de Legenda no Padrão Looker Studio / Power BI */}
                                  <div className="flex-1 w-full min-w-0 space-y-2 max-h-[235px] overflow-y-auto pr-1">
                                    {chartData.map((item, idx) => (
                                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-100 transition-all duration-200 group">
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: EMERALD_COLORS[idx % EMERALD_COLORS.length] }} />
                                          <span className="font-extrabold text-xs text-slate-600 shrink-0">{item.rankIcon}</span>
                                          <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-950 truncate transition-colors">
                                            {item.nome}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0">
                                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200/80 shadow-2xs">
                                            {item.totalTreinos} {item.totalTreinos === 1 ? 'treino' : 'treinos'}
                                          </span>
                                          <span className="font-black text-xs sm:text-sm text-emerald-700 min-w-[38px] text-right">{item.label}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )
        )}
      </div>

      {/* ==============================================================
       * MODAL / DRAWER DE DETALHES COMPLETOS DO ALUNO
       * ============================================================== */}
      {selectedAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in p-0 sm:p-4">
          <div className="bg-white w-full sm:w-[540px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-right border border-gray-100">
            
            {/* Cabeçalho do Modal */}
            <div className="p-6 bg-[var(--color-noir-navy)] text-white flex items-start justify-between gap-4 shrink-0 relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 bg-purple-500/30 text-purple-200 rounded-md border border-purple-400/30">
                    {selectedAluno.objetivo || 'Geral'}
                  </span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                    selectedAluno.statusPlano === 'ASSINANTE' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {selectedAluno.statusPlano}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{selectedAluno.nome}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-300 font-semibold">
                  <span className="flex items-center gap-1"><Mail size={13} /> {selectedAluno.email}</span>
                  {selectedAluno.telefone && (
                    <span className="flex items-center gap-1"><Phone size={13} /> {selectedAluno.telefone}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedAluno(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo Rolável do Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Status da Ficha */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider block">Prescrição & Treinamento</span>
                  <h4 className="text-base font-black text-gray-900 mt-0.5">
                    {selectedAluno.fichaStatus === 'VENCIDA' ? '⚠️ Ficha Vencida' : selectedAluno.fichaStatus === 'SEM_TREINO' ? '⚠️ Sem Prescrição Ativa' : `✔ ${selectedAluno.nomeFicha}`}
                  </h4>
                </div>
                <button
                  onClick={() => navigate('/admin/alunos')}
                  className="px-3.5 py-2 bg-[var(--color-noir-navy)] hover:bg-purple-900 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  Abrir no Estúdio
                  <ExternalLink size={13} />
                </button>
              </div>

              {/* Bloco de Frequência & Streaks no Modal */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Flame size={15} className="text-amber-500" />
                  Frequência & Sequências (Streaks)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white border border-gray-200/80 p-3 rounded-2xl text-center shadow-2xs">
                    <span className="text-[11px] font-bold text-gray-400 block">Semana</span>
                    <span className="text-lg font-black text-gray-800">{selectedAluno.freqSemana}x</span>
                  </div>
                  <div className="bg-white border border-gray-200/80 p-3 rounded-2xl text-center shadow-2xs">
                    <span className="text-[11px] font-bold text-gray-400 block">Mês Atual</span>
                    <span className="text-lg font-black text-purple-700">{selectedAluno.treinosMesAtual}x</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-200/60 p-3 rounded-2xl text-center shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-700 block">Streak Atual</span>
                    <span className="text-lg font-black text-emerald-700">{selectedAluno.streakAtual} sem</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200/70 p-3 rounded-2xl text-center shadow-2xs">
                    <span className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1 block">
                      <Trophy size={11} /> Recorde
                    </span>
                    <span className="text-lg font-black text-amber-700">{selectedAluno.maiorStreak} sem</span>
                  </div>
                </div>
              </div>

              {/* Bloco de Evolução Corporal com Gráfico no Modal */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5 block">
                      <Weight size={14} /> Histórico & Variação de Peso
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl font-black">{formatNumBr(selectedAluno.pesoAtual)} kg</span>
                      
                      {Math.abs(selectedAluno.variacaoKg) < 0.1 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300">
                          Estável
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/25 text-purple-200 border border-purple-400/40">
                          <span>{selectedAluno.variacaoKg > 0 ? '▲' : '▼'}</span>
                          <span>{selectedAluno.variacaoKg > 0 ? `+${formatNumBr(selectedAluno.variacaoPct)}%` : `${formatNumBr(selectedAluno.variacaoPct)}%`}</span>
                          <span className="text-[10px] opacity-80">({selectedAluno.variacaoKg > 0 ? `+${formatNumBr(selectedAluno.variacaoKg)} kg` : `${formatNumBr(selectedAluno.variacaoKg)} kg`})</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedAluno.dataUltimoPeso && (
                    <span className="text-[11px] text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      Última: {selectedAluno.dataUltimoPeso.split(' ')[0].split('-').reverse().join('/')}
                    </span>
                  )}
                </div>

                {/* Gráfico Recharts no Modal */}
                {selectedAluno.graficoPeso && selectedAluno.graficoPeso.length > 1 ? (
                  <div className="w-full h-40 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedAluno.graficoPeso} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="modalPesoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A855F7" stopOpacity={0.7}/>
                            <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="data" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                          formatter={(v) => [`${formatNumBr(v)} kg`, 'Peso']}
                        />
                        <Area type="monotone" dataKey="peso" stroke="#C084FC" strokeWidth={3} fillOpacity={1} fill="url(#modalPesoGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 font-semibold text-xs border-t border-slate-800">
                    O aluno ainda possui apenas o registro inicial de peso na Anamnese ({formatNumBr(selectedAluno.pesoInicial)} kg).
                  </div>
                )}
              </div>

              {/* Informações Extras / Datas de Cadastro */}
              <div className="text-xs font-semibold text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
                <span>Cadastrado na plataforma em {selectedAluno.dataCriacao ? selectedAluno.dataCriacao.split(' ')[0].split('-').reverse().join('/') : 'N/D'}</span>
                <span>ID: {selectedAluno.id}</span>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-200/80 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedAluno(null)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
