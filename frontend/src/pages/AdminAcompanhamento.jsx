import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, TrendingUp, AlertTriangle, ShieldCheck, Clock, 
  Search, RefreshCw, Calendar, ArrowUpRight, Flame, Trophy, 
  Dumbbell, UserCheck, UserX, BarChart3, ChevronRight, Weight, X, ExternalLink, Phone, Mail, Award, Filter, ChevronDown, Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { apiFetch } from '../services/api';

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

        {/* Botões de Navegação entre Abas - Icones com Tooltip no Hover */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto">
          <div className="relative group">
            <button
              onClick={() => setActiveTab('alunos')}
              title="Acompanhamento de Alunos"
              className={`flex items-center justify-center p-3 rounded-lg transition ${
                activeTab === 'alunos' 
                  ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Users size={20} />
            </button>
            <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-lg z-50">
              Acompanhamento de Alunos
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={() => setActiveTab('dashboard')}
              title="Dashboard Gerencial"
              className={`flex items-center justify-center p-3 rounded-lg transition ${
                activeTab === 'dashboard' 
                  ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 size={20} />
            </button>
            <span className="pointer-events-none absolute -bottom-10 right-0 md:left-1/2 md:-translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-lg z-50">
              Dashboard Gerencial
            </span>
          </div>
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
            <div className="space-y-8 max-w-7xl mx-auto">
              
              {/* BLOCO 1: BASE DE ALUNOS & ENGAGED TODAY */}
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  Métricas Gerais de Alunos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <span className="text-xs font-extrabold text-gray-400 uppercase">Total de Alunos</span>
                    <div className="text-3xl font-black text-gray-900 mt-2">{dashboard.base.totalAlunos}</div>
                    <span className="text-[11px] font-bold text-emerald-600 mt-1">Base ativa cadastrada</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <span className="text-xs font-extrabold text-gray-400 uppercase">Alunos Assinantes</span>
                    <div className="text-3xl font-black text-purple-700 mt-2">{dashboard.base.totalAtivos}</div>
                    <span className="text-[11px] font-bold text-gray-500 mt-1">Com plano pago ativo</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <span className="text-xs font-extrabold text-gray-400 uppercase">Em Período de Teste</span>
                    <div className="text-3xl font-black text-blue-600 mt-2">{dashboard.base.totalTrial}</div>
                    <span className="text-[11px] font-bold text-gray-500 mt-1">Aproveitando o Trial</span>
                  </div>
                  <div className="bg-emerald-500 text-white p-5 rounded-2xl border border-emerald-600 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-black uppercase text-emerald-100">Alunos Ativos Hoje</span>
                    <div className="text-4xl font-black mt-2">{dashboard.base.ativosHoje}</div>
                    <span className="text-[11px] font-extrabold text-emerald-100 mt-1">Acessaram o app hoje</span>
                  </div>
                </div>
              </div>

              {/* BLOCO DESTAQUE: TOP 5 RANKINGS & INTELIGÊNCIA ANALÍTICA */}
              {dashboard.top5 && (
                <div>
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    Top 5 — Destaques do Mês & Desempenho
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* TOP 1: Constância no Mês */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                              <Dumbbell size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Treinos no Mês</h3>
                              <span className="text-[11px] font-semibold text-gray-400">Maior constância no período corrente</span>
                            </div>
                          </div>
                        </div>

                        {(!dashboard.top5.treinosMes || dashboard.top5.treinosMes.length === 0) ? (
                          <div className="py-8 text-center text-gray-400 font-bold text-sm">
                            Nenhum treino registrado neste mês.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const maxVal = Math.max(...dashboard.top5.treinosMes.map(x => x.valor), 1);
                              return dashboard.top5.treinosMes.map((item, i) => {
                                const pct = Math.max(Math.round((item.valor / maxVal) * 100), 12);
                                return (
                                  <div key={item.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <span className="w-5 font-black text-center text-sm inline-block">
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                        </span>
                                        <span className="font-extrabold text-gray-800 truncate">{item.nome}</span>
                                      </div>
                                      <span className="font-black text-purple-700 shrink-0">{item.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 2: Frequência Consecutiva (Streak) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                              <Flame size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Frequência Consecutiva</h3>
                              <span className="text-[11px] font-semibold text-gray-400">Sequência ininterrupta (Semanas ativas)</span>
                            </div>
                          </div>
                        </div>

                        {(!dashboard.top5.streak || dashboard.top5.streak.length === 0) ? (
                          <div className="py-8 text-center text-gray-400 font-bold text-sm">
                            Nenhum aluno com sequência consecutiva ativa.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const maxVal = Math.max(...dashboard.top5.streak.map(x => x.valor), 1);
                              return dashboard.top5.streak.map((item, i) => {
                                const pct = Math.max(Math.round((item.valor / maxVal) * 100), 12);
                                return (
                                  <div key={item.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <span className="w-5 font-black text-center text-sm inline-block">
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                        </span>
                                        <span className="font-extrabold text-gray-800 truncate">{item.nome}</span>
                                      </div>
                                      <span className="font-black text-amber-600 shrink-0">{item.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 3: Volume Total Movimentado no Mês */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                              <BarChart3 size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Volume Carga (Mês)</h3>
                              <span className="text-[11px] font-semibold text-gray-400">Total de carga movimentada em kg / toneladas</span>
                            </div>
                          </div>
                        </div>

                        {(!dashboard.top5.volumeMes || dashboard.top5.volumeMes.length === 0) ? (
                          <div className="py-8 text-center text-gray-400 font-bold text-sm">
                            Nenhum volume de treino registrado neste mês.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const maxVal = Math.max(...dashboard.top5.volumeMes.map(x => x.valor), 1);
                              return dashboard.top5.volumeMes.map((item, i) => {
                                const pct = Math.max(Math.round((item.valor / maxVal) * 100), 12);
                                return (
                                  <div key={item.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <span className="w-5 font-black text-center text-sm inline-block">
                                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                        </span>
                                        <span className="font-extrabold text-gray-800 truncate">{item.nome}</span>
                                      </div>
                                      <span className="font-black text-blue-700 shrink-0">{item.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP 4: Eficiência de Conclusão */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                              <Award size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Eficiência nos Treinos</h3>
                              <span className="text-[11px] font-semibold text-gray-400">% de exercícios concluídos (desempate: nº de treinos)</span>
                            </div>
                          </div>
                        </div>

                        {(!dashboard.top5.eficiencia || dashboard.top5.eficiencia.length === 0) ? (
                          <div className="py-8 text-center text-gray-400 font-bold text-sm">
                            Nenhuma sessão concluída para avaliar eficiência.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {dashboard.top5.eficiencia.map((item, i) => {
                              const pct = Math.max(Math.min(item.valor, 100), 12);
                              return (
                                <div key={item.id} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className="w-5 font-black text-center text-sm inline-block">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                      </span>
                                      <span className="font-extrabold text-gray-800 truncate">{item.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] font-bold text-gray-400">({item.totalTreinos} treinos)</span>
                                      <span className="font-black text-emerald-700">{item.label}</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* BLOCO 2: ENGAGEMENT & RETENÇÃO (TERMÔMETRO DA ACADEMIA) */}
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Flame size={16} className="text-amber-500" />
                  Saúde de Engajamento & Frequência
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card de Frequência e Treinaram Hoje */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">Treinos Realizados Hoje</span>
                        <Dumbbell className="text-purple-400" size={20} />
                      </div>
                      <div className="text-5xl font-black text-white mt-4">{dashboard.engajamento.treinaramHoje}</div>
                      <p className="text-xs text-slate-400 mt-2">Sessões completadas por alunos nesta data</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-800/60 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Média na Semana</span>
                        <span className="text-lg font-black text-purple-300">{formatNumBr(dashboard.engajamento.mediaTreinosSemana)}x /aluno</span>
                      </div>
                      <div className="bg-slate-800/60 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Média no Mês</span>
                        <span className="text-lg font-black text-purple-300">{formatNumBr(dashboard.engajamento.mediaTreinosMes)}x /aluno</span>
                      </div>
                    </div>
                  </div>

                  {/* Card de Risco Crítico e Abandono */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <AlertTriangle size={16} className="text-red-500" />
                        Alerta de Inatividade & Evasão
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100">
                          <div>
                            <span className="text-sm font-black text-gray-900 block">7+ Dias Sem Treinar</span>
                            <span className="text-xs font-semibold text-red-600">Recomendado contato de acompanhamento</span>
                          </div>
                          <span className="text-2xl font-black text-red-600">{dashboard.engajamento.inativos7Dias}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                          <div>
                            <span className="text-sm font-black text-gray-900 block">15+ Dias Sem Abrir o App</span>
                            <span className="text-xs font-semibold text-amber-700">Inativos de longa data</span>
                          </div>
                          <span className="text-2xl font-black text-amber-700">{dashboard.engajamento.semAcesso15Dias}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setActiveTab('alunos'); setFilterRisco('RISCO_ABANDONO'); }}
                      className="mt-4 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition text-center cursor-pointer"
                    >
                      Filtrar e Acompanhar Alunos em Risco
                    </button>
                  </div>

                  {/* Card: Volume da Plataforma e Taxa Ativa */}
                  <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-xs font-extrabold text-purple-300 uppercase tracking-widest">Carga Movimentada pela Comunidade</span>
                      <div className="text-4xl font-black text-white mt-3">
                        {dashboard.comunidade.volumeTotalKg >= 1000 
                          ? `${formatNumBr((dashboard.comunidade.volumeTotalKg / 1000).toFixed(1))} t`
                          : `${formatNumBr(dashboard.comunidade.volumeTotalKg)} kg`}
                      </div>
                      <p className="text-xs text-purple-200 mt-1 font-medium">
                        Volume total em toneladas levantadas nos treinos deste mês!
                      </p>
                    </div>

                    <div className="relative z-10 mt-6 pt-4 border-t border-purple-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 uppercase">Taxa de Engajamento Ativo</span>
                        <span className="text-xl font-black text-emerald-400">{dashboard.engajamento.taxaFrequenciaAtiva}%</span>
                      </div>
                      <div className="w-full bg-purple-950 rounded-full h-2.5 mt-2 overflow-hidden border border-purple-800/30">
                        <div className="bg-emerald-400 h-2.5 rounded-full" style={{ width: `${dashboard.engajamento.taxaFrequenciaAtiva}%` }}></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* BLOCO 3: FEEDS DE CADASTRO RECENTE & EVOLUÇÃO DE PESO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tabela: Últimos Alunos Cadastrados */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-purple-600" />
                    Últimos Alunos Cadastrados
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {dashboard.base.ultimosCadastrados.map((u, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-gray-900 block">{u.nome}</span>
                          <span className="text-xs text-gray-400 font-semibold">
                            Cadastrado em {u.dataCriacao ? u.dataCriacao.split(' ')[0].split('-').reverse().join('/') : 'Recentemente'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                          u.statusPlano === 'ASSINANTE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.statusPlano}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabela: Últimas Atualizações de Peso */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={18} className="text-purple-600" />
                      Evolução Corporal Recente
                    </h3>
                    <span className="text-xs font-extrabold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md">
                      Média geral: {formatNumBr(dashboard.evolucao.evolucaoMediaKg)} kg
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dashboard.evolucao.ultimosAtualizaramPeso.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 font-bold text-sm">
                        Nenhuma atualização recente de peso pelos alunos.
                      </div>
                    ) : (
                      dashboard.evolucao.ultimosAtualizaramPeso.map((p, i) => {
                        const isGain = p.variacaoKg > 0;
                        const isStable = Math.abs(p.variacaoKg) < 0.1;

                        return (
                          <div key={i} className="py-3 flex items-center justify-between">
                            <div>
                              <span className="font-extrabold text-sm text-gray-900 block">{p.nome}</span>
                              <span className="text-xs text-gray-400 font-semibold">
                                Registrou {formatNumBr(p.pesoAtual)} kg em {p.dataUltimoPeso ? p.dataUltimoPeso.split(' ')[0].split('-').reverse().join('/') : ''}
                              </span>
                            </div>

                            {isStable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-600">
                                Estável
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/15 text-purple-900 border border-purple-300">
                                <span>{isGain ? '▲' : '▼'}</span>
                                <span>{isGain ? `+${formatNumBr(p.variacaoPct)}%` : `${formatNumBr(p.variacaoPct)}%`}</span>
                                <span className="text-[9px] opacity-75 font-sans">({isGain ? `+${formatNumBr(p.variacaoKg)}kg` : `${formatNumBr(p.variacaoKg)}kg`})</span>
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
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
