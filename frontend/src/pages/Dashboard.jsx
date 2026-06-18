import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, FileText, BarChart2, Flame, Activity, Clock, Loader2, Bot } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    streakSemanas: 0,
    volumeMensal: 0,
    diasDesdeUltimoTreino: null,
    barData: [],
    totalSessoes: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        const result = await apiFetch('/dashboard');
        setData(result);
      } catch (err) {
        console.error('Falha ao carregar dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in pb-2">
      
      {/* Insight Alfred (Topo) */}
      <div className="shrink-0 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-4 mb-6 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-inner">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xs font-black text-purple-800 uppercase tracking-widest mb-0.5">Alfred Diz:</h2>
          <p className="text-sm font-medium text-purple-900">{insightText}</p>
        </div>
      </div>

      <header className="shrink-0 flex justify-between items-center mb-4 px-1">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Evolução</h1>
      </header>

      {/* Faixa Noir (KPIs Reais) */}
      <div className="shrink-0 bg-gray-900 rounded-2xl text-white py-5 px-6 flex flex-col md:flex-row items-center justify-between mb-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full items-center justify-between z-10">
          
          <div className="flex flex-col items-center flex-1 justify-center w-full">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className={data.streakSemanas > 0 ? "text-orange-500" : "text-gray-500"} />
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest">Streak Semanal</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-white tracking-widest">
              {data.streakSemanas} <span className="text-xs font-medium text-gray-400 ml-0.5">semanas</span>
            </span>
          </div>
          
          <div className="flex flex-col items-center flex-1 justify-center w-full md:border-l md:border-gray-800 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-purple-400" />
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest">Esforço (Mês)</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-white tracking-widest">
              {(data.volumeMensal / 1000).toFixed(1)} <span className="text-xs font-medium text-gray-400 ml-0.5">Ton</span>
            </span>
          </div>
          
          <div className="flex flex-col items-center flex-1 justify-center w-full md:border-l md:border-gray-800 md:pl-8">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-blue-400" />
              <span className="text-[10px] uppercase text-gray-400 font-extrabold tracking-widest">Último Treino</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-white tracking-wide">
              {data.diasDesdeUltimoTreino === 0 ? 'Hoje' : data.diasDesdeUltimoTreino === 1 ? 'Ontem' : data.diasDesdeUltimoTreino === null ? 'Nenhum' : `${data.diasDesdeUltimoTreino} dias`}
            </span>
          </div>

        </div>
      </div>



      {/* Gráfico Dinâmico */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 shadow-sm flex flex-col p-6 rounded-2xl">
        <h2 className="text-xs font-black text-gray-800 mb-6 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-purple-600" />
          Evolução de Volume (Kg)
        </h2>
        <div className="w-full h-64 relative">
          {data.barData && data.barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} tickFormatter={(val) => `${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, padding: '10px 16px', fontSize: 13, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{color: '#c084fc'}}
                  formatter={(value) => [`${value} Kg`, 'Volume Levantado']}
                />
                <Bar dataKey="volume" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-400">Sem dados de treino suficientes.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
