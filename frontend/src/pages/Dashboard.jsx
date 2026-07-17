import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, FileText, BarChart2, Flame, Activity, Clock, Loader2, Bot, Timer, CheckCircle, XCircle, ChevronRight, PieChart as PieChartIcon, Gift, AlertTriangle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const CHART_COLORS = ['#7e22ce', '#0EA5E9', '#18518F', '#c084fc', '#d8b4fe', '#f3e8ff'];
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    streakSemanas: 0,
    volumeMensal: 0,
    diasDesdeUltimoTreino: null,
    barData: [],
    distribuicaoTreinos: [],
    totalTreinosMesAtual: 0,
    totalSessoes: 0
  });
  const [notificacoes, setNotificacoes] = useState([]);
  const [trialStatus, setTrialStatus] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const [result, notifs] = await Promise.all([
          apiFetch('/dashboard'),
          apiFetch('/solicitacoes/aluno/notificacoes').catch(() => [])
        ]);
        
        const dismissedIds = JSON.parse(localStorage.getItem('@CorpoConectado:dismissedNotifs') || '[]');
        const unreadNotifs = notifs.filter(n => !dismissedIds.includes(n.id));

        setData(result);
        setNotificacoes(unreadNotifs);
      } catch (err) {
        console.error('Falha ao carregar dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Buscar status do trial (apenas para alunos)
  useEffect(() => {
    if (user?.role === 'admin') return;
    apiFetch('/financeiro/trial-status')
      .then(res => {
        if (res && !res.temAssinatura && res.trialAtivo) {
          setTrialStatus(res);
        }
      })
      .catch(() => {});
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-purple-600" size={32} />
        <p className="text-sm font-bold text-gray-500">Buscando seus resultados...</p>
      </div>
    );
  }

  // Insight Gamificado Baseado no Streak
  let insightText = "Vamos começar a treinar? Sua jornada aguarda!";
  if (data.streakSemanas > 4) insightText = `Você está imparável! Já são ${data.streakSemanas} semanas seguidas mantendo a consistência.`;
  else if (data.streakSemanas > 0) insightText = `Excelente ritmo! Continue assim para bater 4 semanas seguidas.`;
  else if (data.totalSessoes > 0 && data.diasDesdeUltimoTreino !== null) insightText = `Faz ${data.diasDesdeUltimoTreino} dias desde o seu último treino. Que tal agendar a próxima sessão?`;

  const handleDismissNotificacao = (notif) => {
    setNotificacoes(prev => prev.filter(n => n.id !== notif.id));
    const dismissedIds = JSON.parse(localStorage.getItem('@CorpoConectado:dismissedNotifs') || '[]');
    if (!dismissedIds.includes(notif.id)) {
      dismissedIds.push(notif.id);
      localStorage.setItem('@CorpoConectado:dismissedNotifs', JSON.stringify(dismissedIds));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-fade-in pb-2">
      
      {/* Card de Trial Gratuito */}
      {trialStatus && trialStatus.diasRestantes > 0 && (() => {
        const d = trialStatus.diasRestantes;
        const isUrgent = d <= 3;
        const isWarning = d <= 7 && d > 3;
        
        const bgColor = isUrgent ? 'bg-red-50' : isWarning ? 'bg-amber-50' : 'bg-purple-50';
        const borderColor = isUrgent ? 'border-red-200' : isWarning ? 'border-amber-200' : 'border-purple-200';
        const iconBg = isUrgent ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-purple-100';
        const iconColor = isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-purple-600';
        const titleColor = isUrgent ? 'text-red-900' : isWarning ? 'text-amber-900' : 'text-purple-900';
        const textColor = isUrgent ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-purple-700';
        const btnColor = isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-purple-600';
        const IconComp = isUrgent ? AlertTriangle : isWarning ? Clock : Gift;
        
        const msg = d === 1
          ? 'Seu período gratuito termina amanhã!'
          : d <= 3
            ? `Seu período gratuito termina em ${d} dias!`
            : d <= 7
              ? `Faltam ${d} dias para o término do seu período gratuito`
              : `Você tem ${d} dias de acesso gratuito ao Corpo Conectado`;
        
        return (
          <div className={`shrink-0 ${bgColor} border ${borderColor} rounded-2xl p-3 md:p-4 mb-3 md:mb-4 flex items-center justify-between shadow-sm animate-fade-in overflow-hidden relative group cursor-pointer`} onClick={() => navigate('/assinatura')}>
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${isUrgent ? 'animate-pulse' : ''}`}>
                <IconComp size={18} className={iconColor} />
              </div>
              <div>
                <p className={`text-sm font-black ${titleColor} tracking-tight`}>{msg}</p>
                <p className={`text-[11px] font-medium ${textColor} mt-0.5`}>Conheça nossos planos para manter o acesso</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${btnColor} group-hover:translate-x-1 transition-transform shrink-0 relative z-10`}>
              <span className="hidden md:inline">Ver Planos</span> <ArrowRight size={14} strokeWidth={3} />
            </div>
          </div>
        );
      })()}
      
      {/* Insight Alfred (Topo) — com notificação integrada */}
      <div className="shrink-0 bg-purple-50 border border-purple-200 rounded-2xl p-3 md:p-4 flex items-start gap-3 md:gap-4 mb-3 md:mb-6 shadow-sm">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
          <Bot className="text-white w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[10px] md:text-xs font-black text-purple-800 uppercase tracking-widest mb-0.5">Alfred</h2>
          
          {/* Notificação mais recente do treinador (se houver) */}
          {notificacoes.length > 0 && (
            <div className={`rounded-xl p-3 mb-2 border ${notificacoes[0].status === 'APROVADA' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-bold ${notificacoes[0].status === 'APROVADA' ? 'text-emerald-800' : 'text-red-800'}`}>
                📩 Sua solicitação de <strong>{notificacoes[0].tipo === 'AJUSTE_TREINO' ? 'ajuste de treino' : 'reavaliação'}</strong> foi{' '}
                <span className={`font-black ${notificacoes[0].status === 'APROVADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {notificacoes[0].status.toLowerCase()}
                </span>.
              </p>
              {notificacoes[0].observacao_admin && (
                <p className={`text-[11px] italic mt-1 ${notificacoes[0].status === 'APROVADA' ? 'text-emerald-700' : 'text-red-700'}`}>
                  "{notificacoes[0].observacao_admin}"
                </p>
              )}
              <button 
                onClick={() => handleDismissNotificacao(notificacoes[0])}
                className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest transition ${notificacoes[0].status === 'APROVADA' ? 'text-emerald-500 hover:text-emerald-700' : 'text-red-500 hover:text-red-700'}`}
              >
                Entendi, fechar
              </button>
            </div>
          )}

          {/* Alerta do Alfred sobre o trial */}
          {trialStatus && [7, 3, 1].includes(trialStatus.diasRestantes) && (() => {
            const d = trialStatus.diasRestantes;
            const dismissKey = `trial_alert_${d}`;
            const dismissed = JSON.parse(localStorage.getItem('@CorpoConectado:dismissedNotifs') || '[]');
            if (dismissed.includes(dismissKey)) return null;
            
            const msgs = {
              7: 'Olá! Seu período de teste termina em 7 dias. Que tal garantir sua assinatura?',
              3: 'Faltam apenas 3 dias! Ative sua assinatura para não perder o acesso.',
              1: 'Último dia do seu acesso gratuito! Assine agora para continuar treinando.'
            };
            
            return (
              <div className="rounded-xl p-3 mb-2 border bg-purple-50 border-purple-200">
                <p className="text-xs font-bold text-purple-800">
                  ⏳ {msgs[d]}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => navigate('/assinatura')}
                    className="text-[9px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition"
                  >
                    Ver Planos →
                  </button>
                  <button
                    onClick={() => {
                      dismissed.push(dismissKey);
                      localStorage.setItem('@CorpoConectado:dismissedNotifs', JSON.stringify(dismissed));
                      setTrialStatus(prev => ({ ...prev })); // Force re-render
                    }}
                    className="text-[9px] font-bold uppercase tracking-widest text-purple-400 hover:text-purple-600 transition"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            );
          })()}

          <p className="text-sm font-medium text-purple-900">{insightText}</p>
        </div>
      </div>

      <header className="shrink-0 flex justify-between items-center mb-2 md:mb-4 px-1">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meu Progresso</h1>
      </header>

      {/* Faixa Noir (KPIs Reais) */}
      <div className="shrink-0 bg-gray-900 rounded-2xl text-white py-4 md:py-6 px-2 md:px-6 mb-3 md:mb-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        
        <div className="grid grid-cols-3 md:flex md:flex-row gap-2 md:gap-10 w-full items-center justify-between z-10 relative">
          
          <div className="flex flex-col items-center flex-1 justify-center w-full">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 mb-1">
              <Flame size={14} className={data.streakSemanas > 0 ? "text-orange-500" : "text-gray-500 md:w-4 md:h-4"} />
              <span className="text-[8px] md:text-xs uppercase text-gray-400 font-extrabold tracking-widest text-center leading-tight">Sequência<span className="hidden md:inline"> Invicta</span></span>
            </div>
            <span className="text-xl md:text-4xl font-black text-white tracking-widest">
              {data.streakSemanas} <span className="text-[10px] md:text-sm font-medium text-gray-400 ml-0.5">sem</span>
            </span>
          </div>
          
          <div className="flex flex-col items-center flex-1 justify-center w-full border-l border-gray-800 md:px-4">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 mb-1">
              <Timer size={14} className="text-purple-400 md:w-4 md:h-4" />
              <span className="text-[8px] md:text-xs uppercase text-gray-400 font-extrabold tracking-widest text-center leading-tight">Tempo<span className="hidden md:inline"> Total (Mês)</span></span>
            </div>
            <span className="text-xl md:text-4xl font-black text-white tracking-widest whitespace-nowrap">
              {Math.floor((data.tempoMensalSegundos || 0) / 3600)}<span className="text-[10px] md:text-sm font-medium text-gray-400 ml-0.5 mr-0.5 md:mr-1.5">h</span>
              {Math.floor(((data.tempoMensalSegundos || 0) % 3600) / 60)}<span className="text-[10px] md:text-sm font-medium text-gray-400 ml-0.5">m</span>
            </span>
          </div>
          
          <div className="flex flex-col items-center flex-1 justify-center w-full border-l border-gray-800 md:pl-8">
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 mb-1">
              <Clock size={14} className="text-blue-400 md:w-4 md:h-4" />
              <span className="text-[8px] md:text-xs uppercase text-gray-400 font-extrabold tracking-widest text-center leading-tight">Último<span className="hidden md:inline"> Treino</span></span>
            </div>
            <span className="text-base md:text-3xl font-black text-white tracking-wide mt-1 md:mt-0">
              {data.diasDesdeUltimoTreino === 0 ? 'Hoje' : data.diasDesdeUltimoTreino === 1 ? 'Ontem' : data.diasDesdeUltimoTreino === null ? 'N/A' : `${data.diasDesdeUltimoTreino}d`}
            </span>
          </div>

        </div>
      </div>



      {/* Gráfico Dinâmico */}
      <div className="bg-white border border-gray-200 shadow-sm flex flex-col p-3 md:p-6 rounded-2xl mb-2">
        <h2 className="shrink-0 text-[10px] md:text-xs font-black text-gray-800 mb-3 md:mb-6 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-purple-600 md:w-4 md:h-4" />
          Treinos Realizados (Mês a Mês)
        </h2>
        <div className="w-full h-44 md:h-64 relative">
          {data.barData && data.barData.length > 0 && data.barData.some(d => d.treinos > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} allowDecimals={false} domain={[0, dataMax => Math.max(dataMax, 4)]} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, padding: '10px 16px', fontSize: 13, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{color: '#c084fc'}}
                  formatter={(value) => [`${value} ${value === 1 ? 'Treino' : 'Treinos'}`, 'Concluídos']}
                />
                <Bar dataKey="treinos" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-400">Sem dados de treino suficientes.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Distribuição dos Treinos */}
      <div className="bg-white border border-gray-200 shadow-sm flex flex-col p-3 md:p-6 rounded-2xl mb-2">
        <h2 className="shrink-0 text-[10px] md:text-xs font-black text-gray-800 mb-3 md:mb-6 uppercase tracking-widest flex items-center gap-2">
          <PieChartIcon size={14} className="text-purple-600 md:w-4 md:h-4" />
          Distribuição dos Treinos (Mês Atual)
        </h2>
        
        {data.totalTreinosMesAtual > 0 && data.distribuicaoTreinos && data.distribuicaoTreinos.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-10 w-full pt-2 pb-1">
            
            {/* Gráfico Rosquinha */}
            <div className="relative w-52 h-52 md:w-60 md:h-60 shrink-0 mx-auto md:ml-4 [&_:focus]:outline-none [&_path:focus]:outline-none [&_g:focus]:outline-none">
              {/* Texto Central (renderizado antes do SVG para o tooltip ficar por cima) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-gray-900 leading-none">{data.totalTreinosMesAtual}</span>
                <span className="text-[10px] font-black uppercase text-gray-400 mt-1 text-center leading-tight tracking-widest">Treinos<br/>no mês</span>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <PieChart>
                  <Pie
                    data={data.distribuicaoTreinos}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="100%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                  >
                    {data.distribuicaoTreinos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const ptData = payload[0].payload;
                        const ptValue = ptData.value;
                        const dataIndex = data.distribuicaoTreinos.findIndex(d => d.name === ptData.name);
                        const sliceColor = CHART_COLORS[dataIndex % CHART_COLORS.length] || '#c084fc';
                        const percent = Math.round((ptValue / data.totalTreinosMesAtual) * 100);
                        return (
                          <div className="bg-[#1e293b] rounded-xl text-white font-bold px-4 py-2.5 text-[13px] shadow-xl border-none">
                            <p className="mb-1">{ptData.name}</p>
                            <p style={{ color: sliceColor }}>
                              Concluídos : {ptValue} Treino{ptValue !== 1 ? 's' : ''} ({percent}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda Customizada */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto md:min-w-[240px] shrink-0 md:mr-2">
              {data.distribuicaoTreinos.map((entry, index) => {
                const percent = Math.round((entry.value / data.totalTreinosMesAtual) * 100);
                return (
                  <div key={`legend-${index}`} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl shadow-sm transition-all hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-purple-900 transition-colors">{entry.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                      <span className="text-xs font-black text-gray-900">{entry.value}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          <div className="w-full h-44 md:h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">Nenhum treino realizado neste mês.</p>
          </div>
        )}
      </div>

    </div>
  );
}
