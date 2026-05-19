import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Play, CheckCircle2, Circle, ChevronRight, ChevronUp,
  Flame, Target, Zap, Clock, BarChart3, Trophy, X,
  ArrowLeft, ArrowRight, Plus, Timer, Activity
} from 'lucide-react';
import { apiFetch } from '../services/api';

const consistencia = { diasTreinados: 12, metaSemanal: 5, diasSemana: 3, sequencia: 4 };

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Treinos() {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeView, setActiveView] = useState('hub');
  const [expandidoId, setExpandidoId] = useState(null); // Accordion do treino
  const [selectedFichaId, setSelectedFichaId] = useState(null); // Card selecionado para o Hero Header
  const [fichaAtiva, setFichaAtiva] = useState(null);
  const [exIndex, setExIndex] = useState(0);
  const [seriesState, setSeriesState] = useState({});
  const [tempoTotal, setTempoTotal] = useState(0);
  const [descansoAtivo, setDescansoAtivo] = useState(false);
  const [descansoSeg, setDescansoSeg] = useState(0);
  const [treinoFinalizado, setTreinoFinalizado] = useState(false);
  const timerRef = useRef(null);
  const descansoRef = useRef(null);

  useEffect(() => {
    const fetchMyWorkouts = async () => {
      try {
        const data = await apiFetch('/workouts/my-sheet');
        setFichas(data);
      } catch (err) {
        console.error('Erro ao buscar fichas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyWorkouts();
  }, []);

  useEffect(() => {
    if (activeView === 'foco' && !treinoFinalizado) {
      timerRef.current = setInterval(() => setTempoTotal(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeView, treinoFinalizado]);

  useEffect(() => {
    if (descansoAtivo && descansoSeg > 0) {
      descansoRef.current = setInterval(() => setDescansoSeg(s => {
        if (s <= 1) { clearInterval(descansoRef.current); setDescansoAtivo(false); return 0; }
        return s - 1;
      }), 1000);
    }
    return () => clearInterval(descansoRef.current);
  }, [descansoAtivo, descansoSeg]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const iniciarTreino = (ficha) => {
    setFichaAtiva(ficha);
    setExIndex(0);
    setSeriesState({});
    setTempoTotal(0);
    setTreinoFinalizado(false);
    setDescansoAtivo(false);
    setActiveView('foco');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkSerie = (exId, serieIdx) => {
    const key = `${exId}_${serieIdx}`;
    const isConcluido = !seriesState[key];
    setSeriesState(prev => ({ ...prev, [key]: isConcluido }));

    if (isConcluido && fichaAtiva) {
      const ex = fichaAtiva.exercicios[exIndex];
      setDescansoSeg(ex.descanso);
      setDescansoAtivo(true);
    }
  };

  const todasSeriesConcluidas = (ex) =>
    Array.from({ length: ex.series }).every((_, i) => seriesState[`${ex.id}_${i}`]);

  const proximoExercicio = () => {
    if (!fichaAtiva) return;
    if (exIndex < fichaAtiva.exercicios.length - 1) {
      setExIndex(i => i + 1);
      setDescansoAtivo(false);
      setDescansoSeg(0);
    } else {
      setTreinoFinalizado(true);
      clearInterval(timerRef.current);
    }
  };

  const voltarHub = () => {
    clearInterval(timerRef.current);
    clearInterval(descansoRef.current);
    setActiveView('hub');
    setFichaAtiva(null);
    setTreinoFinalizado(false);
  };

  const defaultFicha = fichas.find(f => f.ativa) || fichas[0];
  const fichaDodia = selectedFichaId 
    ? (fichas.find(f => f.id === selectedFichaId) || defaultFicha)
    : defaultFicha;
  
  const progressoFoco = fichaAtiva ? ((exIndex + (treinoFinalizado ? 1 : 0)) / fichaAtiva.exercicios.length) * 100 : 0;

  if (loading) return <div className="p-12 text-center text-gray-500 font-bold">Buscando sua periodização médica...</div>;

  // ─── HUB DE TREINOS (TEMA CLARO) ─────────────────────────────────────────────
  if (activeView === 'hub') {
    if (fichas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <Dumbbell size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Nenhum Treino Ativo</h2>
          <p className="text-gray-500 max-w-sm">
            Seu treinador ainda está elaborando ou inativou sua matriz de treinos. Aguarde a liberação.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4 pb-2 animate-fade-in">

        {/* Header */}
        <header>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meus Treinos</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5">Gerencie fichas, acompanhe evolução e mantenha o ritmo.</p>
        </header>

        {/* ── TOP LAYER: Hero + Analytics ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* ── HERÓI: Treino do Dia (2/3) ──────────────────────────────────────── */}
          <div className="lg:col-span-2 relative rounded-xl md:rounded-2xl overflow-hidden bg-black text-white shadow-lg flex flex-col justify-center">
            {/* Glow decorativo suave */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-5 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 md:mb-2">
                  <Zap size={10} className="text-yellow-400" /> Treino do Dia
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-none mb-1">
                  Treino {fichaDodia.letra}
                </h2>
                <p className="text-gray-300 font-medium text-xs md:text-sm">{fichaDodia.nome}</p>
                <div className="flex items-center gap-3 md:gap-4 mt-3 text-[10px] md:text-[11px]">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Dumbbell size={12} /> {fichaDodia.exercicios.length} exer
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock size={12} /> {fichaDodia.duracao}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 hidden sm:flex">
                    <Target size={12} /> {fichaDodia.objetivo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => iniciarTreino(fichaDodia)}
                className="flex items-center w-full md:w-auto justify-center gap-2 bg-white text-black font-black px-5 py-3 rounded-xl text-sm
                           hover:bg-gray-100 active:scale-95 transition-all shadow-md whitespace-nowrap"
              >
                <Play size={14} fill="black" /> Iniciar Treino
              </button>
            </div>
          </div>

          {/* ── Consistência Semanal (1/3) ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Treinados', valor: consistencia.diasTreinados, icon: Trophy, cor: 'text-yellow-500', sub: 'Mês' },
              { label: 'Sequência', valor: `${consistencia.sequencia}d`, icon: Flame, cor: 'text-orange-500', sub: 'Foco' },
              { label: 'Meta', valor: `${consistencia.diasSemana}/${consistencia.metaSemanal}`, icon: Target, cor: 'text-emerald-500', sub: 'Semana' },
              { label: 'Volume', valor: 'Alto', icon: BarChart3, cor: 'text-blue-500', sub: '7 dias' },
            ].map(({ label, valor, icon: Icon, cor, sub }) => (
              <div key={label} className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 md:p-4 flex flex-col justify-center gap-1 hover:border-gray-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Icon size={14} className={cor} />
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-wider">{sub}</span>
                </div>
                <span className="text-xl md:text-2xl font-black text-gray-900 leading-none">{valor}</span>
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Biblioteca de Fichas ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Biblioteca de Fichas</h2>
            <button className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-500 hover:text-black transition-colors bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              <Plus size={12} /> Nova Ficha
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {fichas.map(ficha => {
              const isSelected = fichaDodia?.id === ficha.id;
              return (
              <div
                key={ficha.id}
                onClick={() => setSelectedFichaId(ficha.id)}
                className={`group bg-white flex flex-col border rounded-xl md:rounded-2xl overflow-hidden
                           hover:shadow-md transition-all duration-300 cursor-pointer ${isSelected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Top accent */}
                <div className={`h-1 w-full ${isSelected ? 'bg-black' : 'bg-gray-200'}`} />

                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <span className="text-lg font-black text-gray-900">{ficha.letra}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-sm leading-none">{ficha.nome}</h3>
                        {isSelected && (
                          <span className="inline-block mt-1 text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest">Ativo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mb-4 flex-1">
                     <p className="text-[11px] font-medium text-gray-600">{ficha.objetivo}</p>
                     <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                       <span className="flex items-center gap-1"><Dumbbell size={10} /> {ficha.exercicios.length} exer</span>
                       <span className="flex items-center gap-1"><Clock size={10} /> {ficha.duracao}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => iniciarTreino(ficha)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-black text-white
                                 text-[11px] font-black hover:bg-gray-800 active:scale-95 transition-all"
                    >
                      <Play size={10} fill="white" /> Iniciar
                    </button>
                    <button 
                      onClick={() => setExpandidoId(expandidoId === ficha.id ? null : ficha.id)}
                      className="px-2.5 py-2 rounded-lg bg-gray-50 text-gray-500 hover:text-black border border-gray-200 hover:bg-gray-100 transition-all"
                      title="Ver Exercícios"
                    >
                      {expandidoId === ficha.id ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>

                  {/* ── EXPANDABLE CONTENT (VISÃO COMPLETA) ── */}
                  {expandidoId === ficha.id && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5 animate-fade-in bg-gray-50/50 p-3 rounded-lg">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Relação de Exercícios</p>
                      {ficha.exercicios.map((ex, i) => (
                        <div key={ex.id} className="flex justify-between items-center text-[11px] border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                          <span className="font-bold text-gray-800 truncate pr-2 max-w-[70%]">
                            {i + 1}. {ex.nome}
                          </span>
                          <span className="text-gray-500 font-black shrink-0 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                            {ex.series}x {ex.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ─── MODO FOCO (EXECUÇÃO) - TEMA CLARO ──────────────────────────────────────
  if (activeView === 'foco' && fichaAtiva) {
    const exAtual = fichaAtiva.exercicios[exIndex];

    if (treinoFinalizado) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-6 animate-fade-in px-4">
          <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center shadow-lg mb-2">
            <Trophy size={36} className="text-yellow-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">Treino Concluído!</h2>
          <p className="text-gray-500 font-medium max-w-xs">
            Excelente performance hoje. Tempo total: <span className="text-black font-black">{formatTime(tempoTotal)}</span>
          </p>
          <div className="grid grid-cols-2 gap-4 mt-2 w-full max-w-xs">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-gray-900">{fichaAtiva.exercicios.length}</span>
              <p className="text-xs text-gray-500 mt-1">Exercícios</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <span className="text-2xl font-black text-gray-900">{formatTime(tempoTotal)}</span>
              <p className="text-xs text-gray-500 mt-1">Tempo Total</p>
            </div>
          </div>
          <button
            onClick={voltarHub}
            className="mt-4 bg-black text-white font-black px-6 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Voltar ao Hub
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0 animate-fade-in pb-12">

        {/* ── HUD Header ────────────────────────────────────────────────── */}
        <div className="sticky top-[-24px] z-20 bg-white/90 backdrop-blur-md pt-4 pb-4 mb-6 -mx-2 px-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <button onClick={voltarHub} className="flex items-center gap-2 text-gray-400 hover:text-black transition text-sm font-bold">
              <X size={18} /> Encerrar
            </button>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              <Timer size={14} className="text-black" />
              <span className="font-black text-black tabular-nums">{formatTime(tempoTotal)}</span>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-700 ease-out"
              style={{ width: `${progressoFoco}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
            <span>Treino {fichaAtiva.letra}</span>
            <span>{exIndex + 1} / {fichaAtiva.exercicios.length}</span>
          </div>
        </div>

        {/* ── Card do Exercício Ativo ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-1 bg-gray-50 rounded border border-gray-100">{exAtual.grupomuscular}</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">{exAtual.nome}</h2>

          <div className="flex gap-3 mb-6">
            {[
              { label: 'Séries', valor: exAtual.series },
              { label: 'Reps', valor: exAtual.reps },
              { label: 'Descanso', valor: `${exAtual.descanso}s` },
            ].map(({ label, valor }) => (
              <div key={label} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="text-lg font-black text-gray-900">{valor}</span>
                <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Séries com input de carga */}
          <div className="space-y-3">
            {Array.from({ length: exAtual.series }).map((_, serieIdx) => {
              const key = `${exAtual.id}_${serieIdx}`;
              const feita = !!seriesState[key];
              return (
                <div
                  key={serieIdx}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                    ${feita
                      ? 'bg-gray-50 border-gray-200 opacity-60 grayscale'
                      : 'bg-white border-gray-200 shadow-sm'
                    }`}
                >
                  <span className={`text-sm font-black w-6 text-center ${feita ? 'text-gray-400' : 'text-gray-900'}`}>
                    {serieIdx + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Carga (kg)"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-black text-gray-900 outline-none placeholder-gray-400 focus:border-black transition"
                    />
                    <span className={`text-sm font-medium ${feita ? 'text-gray-400' : 'text-gray-600'}`}>{exAtual.reps} reps</span>
                  </div>
                  <button
                    onClick={() => checkSerie(exAtual.id, serieIdx)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90
                      ${feita ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:text-black hover:bg-gray-200'}`}
                  >
                    {feita ? <CheckCircle2 size={18} fill="black" className="text-white" /> : <Circle size={18} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Descanso Countdown ──────────────────────────────────────────── */}
        {descansoAtivo && (
          <div className="bg-black rounded-2xl p-5 mb-6 flex items-center justify-between shadow-xl animate-fade-in relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Descanso</p>
              <span className="text-4xl font-black text-white tabular-nums">{formatTime(descansoSeg)}</span>
            </div>
            <button
              onClick={() => { setDescansoAtivo(false); setDescansoSeg(0); }}
              className="relative z-10 text-xs font-black text-white bg-white/20 hover:bg-white/30 border border-white/20 px-4 py-2 rounded-xl transition"
            >
              Pular
            </button>
          </div>
        )}

        {/* ── Navegação ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => { if (exIndex > 0) { setExIndex(i => i - 1); setDescansoAtivo(false); } }}
            disabled={exIndex === 0}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-black text-gray-500
                       hover:text-black hover:bg-gray-100 border border-gray-200 transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowLeft size={16} /> Anterior
          </button>
          <button
            onClick={proximoExercicio}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white bg-black
                       hover:bg-gray-800 active:scale-95 transition-all text-sm shadow-md"
          >
            {exIndex === fichaAtiva.exercicios.length - 1 ? (
              <><Trophy size={16} /> Finalizar Treino</>
            ) : (
              <>Próximo <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        {/* ── Lista de todos exercícios (mini-map) ─────────────────────────── */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Exercícios do Treino</h3>
          <div className="space-y-2">
            {fichaAtiva.exercicios.map((ex, idx) => {
              const done = todasSeriesConcluidas(ex);
              const isActive = idx === exIndex;
              return (
                <button
                  key={ex.id}
                  onClick={() => setExIndex(idx)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-xl text-left transition-all border
                    ${isActive ? 'bg-white border-black shadow-sm' : done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition
                    ${done ? 'bg-black text-white' : isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate ${isActive ? 'text-black' : 'text-gray-700'}`}>{ex.nome}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{ex.series} séries · {ex.reps} reps</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
