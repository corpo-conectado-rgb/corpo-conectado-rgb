import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, TrendingUp, AlertTriangle, ShieldCheck, Clock, 
  Search, RefreshCw, Calendar, ArrowUpRight, Flame, Trophy, 
  Dumbbell, UserCheck, UserX, BarChart3, ChevronRight, Weight 
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
      <div className="px-6 lg:px-10 pt-6 pb-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Activity className="text-purple-600" size={32} />
            Acompanhamento & BI
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Supervisão de engajamento, frequência de treino e inteligência analítica de alunos
          </p>
        </div>

        {/* Botões de Navegação entre Abas */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('alunos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs transition uppercase tracking-wider ${
              activeTab === 'alunos' 
                ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={15} />
            Acompanhamento de Alunos
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs transition uppercase tracking-wider ${
              activeTab === 'dashboard' 
                ? 'bg-[var(--color-noir-navy)] text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={15} />
            Dashboard Gerencial
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
           * ABA 1: ACOMPANHAMENTO DE ALUNOS
           * ============================================================== */
          <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* Barra de Controles: Pesquisa e Filtros */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              {/* Pílulas de Filtro de Engajamento */}
              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                {[
                  { id: 'TODOS', label: 'Todos os Alunos', color: 'bg-gray-800 text-white' },
                  { id: 'ENGAJADOS', label: '🟢 Engajados', color: 'bg-emerald-600 text-white' },
                  { id: 'ALERTA', label: '🟡 Em Alerta (4+ dias)', color: 'bg-amber-500 text-white' },
                  { id: 'RISCO_ABANDONO', label: '🔴 Risco Abandono', color: 'bg-red-600 text-white' },
                  { id: 'TRIAL', label: '🕒 Trial / Em Teste', color: 'bg-blue-600 text-white' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setFilterRisco(btn.id)}
                    className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition ${
                      filterRisco === btn.id 
                        ? `${btn.color} shadow-md` 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista / Grid de Alunos */}
            {filteredAlunos.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400 font-bold">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAlunos.map(a => {
                  // Badge Estético Neutro de Evolução de Peso
                  const isGain = a.variacaoKg > 0;
                  const isStable = Math.abs(a.variacaoKg) < 0.1;

                  return (
                    <div 
                      key={a.id} 
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Topo do Card */}
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-gray-900 tracking-tight">{a.nome}</h3>
                              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 uppercase">
                                {a.objetivo}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">{a.email}</p>
                          </div>

                          {/* Status de Risco / Retenção */}
                          {a.statusEngajamento === 'ENGAJADO' && (
                            <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              🟢 Ativo & Engajado
                            </span>
                          )}
                          {a.statusEngajamento === 'ALERTA' && (
                            <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              🟡 Atenção ({a.diasSemTreinar !== null ? `${a.diasSemTreinar} d. sem treino` : 'Sem treinos'})
                            </span>
                          )}
                          {a.statusEngajamento === 'RISCO_ABANDONO' && (
                            <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black bg-red-50 text-red-600 border border-red-200 flex items-center gap-1 animate-pulse">
                              🔴 Risco de Abandono
                            </span>
                          )}
                        </div>

                        {/* Bloco 1: Acesso e Ficha */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 px-4 bg-gray-50 rounded-xl mb-4 text-xs font-semibold text-gray-700 border border-gray-100">
                          <div>
                            <span className="block text-[10px] uppercase font-black text-gray-400">Última Vez no App</span>
                            <span className={a.diasSemAcessar > 15 ? 'text-red-600 font-black' : 'text-gray-900 font-extrabold'}>
                              {a.diasSemAcessar === 0 ? 'Hoje' : `Há ${a.diasSemAcessar} dia${a.diasSemAcessar !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-black text-gray-400">Último Treino Feito</span>
                            <span className={a.diasSemTreinar > 7 ? 'text-red-600 font-black' : 'text-gray-900 font-extrabold'}>
                              {a.diasSemTreinar === null ? 'Nunca treinou' : a.diasSemTreinar === 0 ? 'Hoje' : `Há ${a.diasSemTreinar} dia${a.diasSemTreinar !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 mt-2 sm:mt-0">
                            <span className="block text-[10px] uppercase font-black text-gray-400">Status da Ficha</span>
                            <span className={`font-black uppercase text-[11px] ${
                              a.fichaStatus === 'ATIVA' ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {a.fichaStatus === 'VENCIDA' ? '⚠️ Ficha Vencida' : a.fichaStatus === 'SEM_TREINO' ? '⚠️ Sem Prescrição' : `✔ ${a.nomeFicha}`}
                            </span>
                          </div>
                        </div>

                        {/* Bloco 2: Frequência e Streaks */}
                        <div className="mb-4">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                            <Flame size={14} className="text-amber-500" />
                            Frequência de Treinos & Sequências (Streaks)
                          </h4>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-xs">
                              <span className="text-[10px] font-bold text-gray-400 block">Semana</span>
                              <span className="text-base font-black text-gray-800">{a.freqSemana}x</span>
                            </div>
                            <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-xs">
                              <span className="text-[10px] font-bold text-gray-400 block">Mês Atual</span>
                              <span className="text-base font-black text-purple-700">{a.treinosMesAtual}x</span>
                            </div>
                            <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-xs">
                              <span className="text-[10px] font-bold text-gray-400 block">Streak Atual</span>
                              <span className="text-base font-black text-emerald-600 flex items-center justify-center gap-1">
                                {a.streakAtual} <span className="text-[10px] font-normal">sm</span>
                              </span>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-200/50 p-2.5 rounded-xl text-center shadow-xs">
                              <span className="text-[10px] font-bold text-amber-600 block flex items-center justify-center gap-1">
                                <Trophy size={11} /> Recorde
                              </span>
                              <span className="text-base font-black text-amber-700">
                                {a.maiorStreak} <span className="text-[10px] font-normal">sm</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bloco 3: Evolução Física & Gráfico de Peso */}
                        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 shadow-inner">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-black uppercase tracking-wider mb-1">
                              <Weight size={13} className="text-purple-400" />
                              Peso Atual & Variação
                            </div>
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <span className="text-2xl font-black tracking-tight">
                                {formatNumBr(a.pesoAtual)} kg
                              </span>

                              {/* Badge reativo roxo neutro (Padrão Corpo Conectado) */}
                              {isStable ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-300/80 border border-purple-400/20">
                                  Estável
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-200 border border-purple-400/30">
                                  <span className="text-purple-400">{isGain ? '▲' : '▼'}</span>
                                  <span>{isGain ? `+${formatNumBr(a.variacaoPct)}%` : `${formatNumBr(a.variacaoPct)}%`}</span>
                                  <span className="text-[9px] opacity-80">({isGain ? `+${formatNumBr(a.variacaoKg)}kg` : `${formatNumBr(a.variacaoKg)}kg`})</span>
                                </span>
                              )}
                            </div>
                            {a.dataUltimoPeso && (
                              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                                Última pesagem: {a.dataUltimoPeso.split(' ')[0].split('-').reverse().join('/')}
                              </span>
                            )}
                          </div>

                          {/* Mini Sparkline Recharts */}
                          {a.graficoPeso && a.graficoPeso.length > 1 && (
                            <div className="w-24 h-14 opacity-90">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={a.graficoPeso}>
                                  <defs>
                                    <linearGradient id={`colorPeso-${a.id}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.6}/>
                                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="peso" stroke="#C084FC" strokeWidth={2} fillOpacity={1} fill={`url(#colorPeso-${a.id})`} />
                                  <Tooltip formatter={(v) => [`${formatNumBr(v)} kg`, 'Peso']} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rodapé de Ações do Card */}
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button 
                          onClick={() => navigate('/admin/alunos')}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[var(--color-noir-navy)] text-white hover:opacity-90 transition flex items-center gap-1.5"
                        >
                          Abrir Ficha / Editar Aluno
                          <ChevronRight size={14} />
                        </button>
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
                      className="mt-4 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition text-center"
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
    </div>
  );
}
