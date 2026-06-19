import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dumbbell, Play, CheckCircle2, Circle, ChevronRight, ChevronUp, ChevronLeft,
  Flame, Target, Zap, Clock, BarChart3, Trophy, X,
  ArrowLeft, ArrowRight, Timer, History, Minus, Plus
} from 'lucide-react';
import { apiFetch } from '../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const formatVolume = (v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k` : String(v);
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

const DIAS_SEMANA_CURTO = { 'Domingo': 'Dom', 'Segunda-feira': 'Seg', 'Terça-feira': 'Ter', 'Quarta-feira': 'Qua', 'Quinta-feira': 'Qui', 'Sexta-feira': 'Sex', 'Sábado': 'Sáb' };

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Treinos() {
  // ─── State ──────────────────────────────────────────────────────────────
  const [fichas, setFichas] = useState([]);
  const [stats, setStats] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Buscando sua periodização médica...");

  const [activeView, setActiveView] = useState('hub'); // 'hub' | 'foco' | 'historico'
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  // Foco (execução)
  const [fichaAtiva, setFichaAtiva] = useState(null);
  const [exIndex, setExIndex] = useState(0);
  const [seriesState, setSeriesState] = useState({}); // { "exId_serieIdx": { concluida, carga, reps } }
  const [tempoTotal, setTempoTotal] = useState(0);
  const [horaInicio, setHoraInicio] = useState(null);
  const [descansoAtivo, setDescansoAtivo] = useState(false);
  const [descansoSeg, setDescansoSeg] = useState(0);
  const [descansoMax, setDescansoMax] = useState(0);
  const [treinoFinalizado, setTreinoFinalizado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [proximaLetra, setProximaLetra] = useState(null);
  const timerRef = useRef(null);
  const descansoRef = useRef(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    // 1. Stale-While-Revalidate: Tentar carregar do cache local imediatamente
    const cached = localStorage.getItem('corpoConectado_treinos_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.fichasData?.length > 0) {
          setFichas(parsed.fichasData);
          setStats(parsed.statsData);
          setHistorico(parsed.histData);
          setLoading(false); // Já temos dados, tira a tela de loading instantaneamente
        }
      } catch (e) {
        // Ignora erro de parse, vai buscar na rede
      }
    }

    // 2. Buscar os dados mais recentes do servidor em background (ou foreground se não houver cache)
    try {
      const [fichasData, statsData, histData] = await Promise.all([
        apiFetch('/workouts/my-sheet'),
        apiFetch('/workouts/stats').catch(() => null),
        apiFetch('/workouts/history?limit=5').catch(() => []),
      ]);
      
      // Garantir ordenação estrita (Data e Hora) no frontend
      if (histData) {
        histData.sort((a, b) => {
          const dDiff = new Date(b.data) - new Date(a.data);
          if (dDiff !== 0) return dDiff;
          if (a.hora_fim && b.hora_fim) return b.hora_fim.localeCompare(a.hora_fim);
          return 0;
        });
      }

      setFichas(fichasData);
      setStats(statsData);
      setHistorico(histData);
      
      // 3. Atualizar o cache para o próximo acesso
      localStorage.setItem('corpoConectado_treinos_cache', JSON.stringify({ fichasData, statsData, histData }));
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Efeito para Mensagens Dinâmicas de Loading (Cold Start UX)
  useEffect(() => {
    if (!loading) return; // Se não estiver carregando, cancela

    const messages = [
      { time: 3000, text: "Despertando nosso servidor seguro..." },
      { time: 8000, text: "Isso leva alguns segundinhos no primeiro acesso do dia! ☕" },
      { time: 15000, text: "Organizando suas cargas e exercícios..." },
      { time: 30000, text: "Quase lá, obrigado pela paciência..." }
    ];

    const timeouts = messages.map(msg => 
      setTimeout(() => setLoadingMessage(msg.text), msg.time)
    );

    return () => timeouts.forEach(clearTimeout); // Limpar caso componente desmonte ou carregamento acabe
  }, [loading]);

  // Timer principal
  useEffect(() => {
    if (activeView === 'foco' && !treinoFinalizado) {
      timerRef.current = setInterval(() => setTempoTotal(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeView, treinoFinalizado]);

  // Timer de descanso
  useEffect(() => {
    if (descansoAtivo && descansoSeg > 0) {
      descansoRef.current = setInterval(() => setDescansoSeg(s => {
        if (s <= 1) { clearInterval(descansoRef.current); setDescansoAtivo(false); return 0; }
        return s - 1;
      }), 1000);
    }
    return () => clearInterval(descansoRef.current);
  }, [descansoAtivo, descansoSeg]);

  // ─── Ações ──────────────────────────────────────────────────────────────
  const iniciarTreino = async (ficha) => {
    // Buscar cargas da última sessão
    let lastLoads = [];
    try {
      lastLoads = await apiFetch(`/workouts/last-loads/${ficha.id}`);
    } catch { /* sem histórico anterior */ }

    // Inicializar state das séries com pré-preenchimento
    const initialState = {};
    ficha.exercicios.forEach(ex => {
      const lastEx = lastLoads.find(l => l.nome === ex.nome || l.exercicio_id === ex.id);
      Array.from({ length: ex.series }).forEach((_, i) => {
        const lastSerie = lastEx?.series?.[i];
        initialState[`${ex.id}_${i}`] = {
          concluida: false,
          carga: lastSerie?.carga || '',
          reps: ex.reps
        };
      });
    });

    setFichaAtiva(ficha);
    setExIndex(0);
    setSeriesState(initialState);
    setTempoTotal(0);
    setHoraInicio(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setTreinoFinalizado(false);
    setDescansoAtivo(false);
    setDescansoSeg(0);
    setProximaLetra(null);
    setActiveView('foco');
  };

  const checkSerie = (exId, serieIdx) => {
    const key = `${exId}_${serieIdx}`;
    const current = seriesState[key];
    const newConcluida = !current.concluida;

    setSeriesState(prev => ({
      ...prev,
      [key]: { ...prev[key], concluida: newConcluida }
    }));

    // Iniciar descanso ao concluir
    if (newConcluida && fichaAtiva) {
      const ex = fichaAtiva.exercicios[exIndex];
      setDescansoMax(ex.descanso);
      setDescansoSeg(ex.descanso);
      setDescansoAtivo(true);
    }
  };

  const updateCarga = (exId, serieIdx, value) => {
    const key = `${exId}_${serieIdx}`;
    setSeriesState(prev => ({
      ...prev,
      [key]: { ...prev[key], carga: value }
    }));
  };

  const todasSeriesConcluidas = (ex) =>
    Array.from({ length: ex.series }).every((_, i) => seriesState[`${ex.id}_${i}`]?.concluida);

  const proximoExercicio = () => {
    if (!fichaAtiva) return;
    if (exIndex < fichaAtiva.exercicios.length - 1) {
      setExIndex(i => i + 1);
      setDescansoAtivo(false);
      setDescansoSeg(0);
    } else {
      finalizarTreino();
    }
  };

  const finalizarTreino = async () => {
    setTreinoFinalizado(true);
    clearInterval(timerRef.current);
    clearInterval(descansoRef.current);
    setDescansoAtivo(false);
    setSalvando(true);

    const horaFim = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Montar payload
    const exerciciosPayload = fichaAtiva.exercicios.map(ex => ({
      exercicio_id: ex.id,
      nome: ex.nome,
      series: Array.from({ length: ex.series }).map((_, i) => {
        const s = seriesState[`${ex.id}_${i}`];
        return {
          carga: Number(s?.carga) || 0,
          reps: parseInt(s?.reps) || 0,
          concluida: s?.concluida || false
        };
      })
    }));

    try {
      const result = await apiFetch('/workouts/complete', {
        method: 'POST',
        body: JSON.stringify({
          dia_treino_id: fichaAtiva.id,
          treino_id: fichaAtiva.treino_id,
          letra: fichaAtiva.letra,
          nome_dia: fichaAtiva.nome,
          duracao_seg: tempoTotal,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          exercicios: exerciciosPayload
        })
      });
      setProximaLetra(result.proxima_letra);
    } catch (err) {
      console.error('Erro ao salvar treino:', err);
    } finally {
      setSalvando(false);
    }
  };

  const voltarHub = async () => {
    clearInterval(timerRef.current);
    clearInterval(descansoRef.current);
    setActiveView('hub');
    setFichaAtiva(null);
    setTreinoFinalizado(false);
    // Recarregar dados atualizados
    setLoading(true);
    await fetchData();
  };

  // Calcular progresso e volume na execução
  const progressoFoco = fichaAtiva ? ((exIndex + (treinoFinalizado ? 1 : 0)) / fichaAtiva.exercicios.length) * 100 : 0;
  const volumeTotal = fichaAtiva ? fichaAtiva.exercicios.reduce((total, ex) => {
    return total + Array.from({ length: ex.series }).reduce((sum, _, i) => {
      const s = seriesState[`${ex.id}_${i}`];
      if (s?.concluida) return sum + ((Number(s.carga) || 0) * (parseInt(s.reps) || 0));
      return sum;
    }, 0);
  }, 0) : 0;

  const seriesConcluidas = fichaAtiva ? Object.values(seriesState).filter(s => s.concluida).length : 0;

  // Determinar próximo treino para o hub
  const proximaLetraHub = stats?.proxima_letra || fichas[0]?.letra;
  const letraAtivaHub = fichaSelecionada || proximaLetraHub;
  const fichaProxima = fichas.find(f => f.letra === letraAtivaHub) || fichas[0];

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in p-6 text-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
        <div className="max-w-xs space-y-2">
          <p className="text-base font-black text-gray-900">Preparando treinos...</p>
          <p className="text-sm text-gray-500 font-medium transition-all duration-500 animate-fade-in">
            {loadingMessage}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: HISTÓRICO COMPLETO
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeView === 'historico') {
    return <HistoricoView onBack={() => setActiveView('hub')} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: MODO FOCO (EXECUÇÃO)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeView === 'foco' && fichaAtiva) {
    const exAtual = fichaAtiva.exercicios[exIndex];

    // ── Tela de Conclusão ──
    if (treinoFinalizado) {
      const proximaFicha = fichas.find(f => f.letra === proximaLetra);
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-5 animate-fade-in px-4">
          <div className="w-18 h-18 rounded-full bg-black flex items-center justify-center shadow-lg">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Treino Concluído!</h2>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              { label: 'Tempo', valor: formatTime(tempoTotal) },
              { 
                label: 'Eficiência', 
                valor: `${fichaAtiva.exercicios.reduce((acc, ex) => acc + ex.series, 0) > 0 ? Math.round((seriesConcluidas / fichaAtiva.exercicios.reduce((acc, ex) => acc + ex.series, 0)) * 100) : 0}%` 
              },
              { label: 'Exercícios', valor: fichaAtiva.exercicios.length },
              { label: 'Séries', valor: seriesConcluidas },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="text-lg font-black text-gray-900 block">{valor}</span>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {proximaFicha && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 mt-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Próximo Treino</p>
              <p className="font-black text-gray-900">Treino {proximaLetra} · {proximaFicha.nome}</p>
            </div>
          )}

          {salvando ? (
            <p className="text-sm text-gray-400 animate-pulse">Salvando sessão...</p>
          ) : (
            <button onClick={voltarHub}
              className="mt-2 bg-black text-white font-black px-8 py-3.5 rounded-xl hover:bg-gray-800 active:scale-95 transition-all text-sm w-full max-w-xs">
              Voltar ao Hub
            </button>
          )}
        </div>
      );
    }

    // ── Overlay de Descanso ──
    if (descansoAtivo) {
      const pct = descansoMax > 0 ? ((descansoMax - descansoSeg) / descansoMax) * 100 : 0;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in bg-black text-white -m-4 md:-m-5 lg:-m-6 p-6 rounded-2xl">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Descanso</p>
          <span className="text-6xl font-black tabular-nums">{formatTime(descansoSeg)}</span>

          {/* Barra de progresso */}
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000 ease-linear rounded-full" style={{ width: `${pct}%` }} />
          </div>

          <button onClick={() => { setDescansoAtivo(false); setDescansoSeg(0); }}
            className="text-sm font-black text-white bg-white/15 hover:bg-white/25 border border-white/20 px-6 py-2.5 rounded-xl transition mt-4 active:scale-95">
            Pular Descanso
          </button>

          <p className="text-xs text-gray-500 mt-2">
            {exAtual.nome} · Série {Array.from({ length: exAtual.series }).filter((_, i) => seriesState[`${exAtual.id}_${i}`]?.concluida).length}/{exAtual.series}
          </p>
        </div>
      );
    }

    // ── Execução do Exercício ──
    return (
      <div className="flex flex-col h-full animate-fade-in overflow-y-auto">

        {/* HUD Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <button onClick={voltarHub} className="flex items-center gap-1.5 text-gray-400 hover:text-black transition text-sm font-bold active:scale-95">
              <X size={18} /> Encerrar
            </button>
            <div className="flex items-center gap-1.5 text-sm font-black text-black bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              <Timer size={13} />
              <span className="tabular-nums">{formatTime(tempoTotal)}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-500 ease-out rounded-full" style={{ width: `${progressoFoco}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">
            <span>Treino {fichaAtiva.letra}</span>
            <span>{exIndex + 1} / {fichaAtiva.exercicios.length}</span>
          </div>
        </div>

        {/* Card do Exercício */}
        <div className="flex-1">
          <div className="mb-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-50 rounded border border-gray-100">{exAtual.grupomuscular}</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-4 leading-tight">{exAtual.nome}</h2>

          {/* Info pills */}
          <div className="flex gap-2 mb-5">
            {[
              { label: 'Séries', valor: exAtual.series },
              { label: 'Reps', valor: exAtual.reps },
              { label: 'Descanso', valor: `${exAtual.descanso}s` },
            ].map(({ label, valor }) => (
              <div key={label} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl py-2.5 text-center">
                <span className="text-base font-black text-gray-900 block">{valor}</span>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Séries */}
          <div className="space-y-2.5">
            {Array.from({ length: exAtual.series }).map((_, serieIdx) => {
              const key = `${exAtual.id}_${serieIdx}`;
              const serie = seriesState[key] || {};
              const feita = serie.concluida;
              return (
                <div key={serieIdx}
                  className={`flex items-center gap-2 md:gap-3 p-3 md:p-5 rounded-xl border transition-all duration-200
                    ${feita ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <span className={`text-sm font-black w-5 text-center shrink-0 ${feita ? 'text-gray-400' : 'text-gray-900'}`}>
                    {serieIdx + 1}
                  </span>

                  {/* Input de carga com +/- */}
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <button onClick={() => updateCarga(exAtual.id, serieIdx, Math.max(0, (Number(serie.carga) || 0) - 2.5))}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 shrink-0">
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={serie.carga}
                      onChange={(e) => updateCarga(exAtual.id, serieIdx, e.target.value)}
                      placeholder="kg"
                      className={`flex-1 min-w-[40px] bg-gray-50 border border-gray-200 rounded-lg px-1 py-1.5 md:py-2 text-center text-sm font-black outline-none h-8 md:h-10
                        ${feita ? 'text-gray-400' : 'text-gray-900 focus:border-black focus:ring-1 focus:ring-black'}`}
                    />
                    <button onClick={() => updateCarga(exAtual.id, serieIdx, (Number(serie.carga) || 0) + 2.5)}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 shrink-0">
                      <Plus size={16} />
                    </button>
                  </div>

                  <span className={`text-[11px] md:text-xs font-medium whitespace-nowrap shrink-0 ${feita ? 'text-gray-400' : 'text-gray-600'}`}>{exAtual.reps}</span>

                  {/* Botão concluir série */}
                  <button onClick={() => checkSerie(exAtual.id, serieIdx)}
                    className={`w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0
                      ${feita ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {feita ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-3 mt-5 px-1 pb-2 sticky bottom-0 bg-white/95 backdrop-blur-sm pt-3 border-t border-gray-100">
          <button
            onClick={() => { if (exIndex > 0) { setExIndex(i => i - 1); setDescansoAtivo(false); } }}
            disabled={exIndex === 0}
            className="flex items-center justify-center w-12 h-12 rounded-xl text-gray-500 hover:bg-gray-100 border border-gray-200 transition disabled:opacity-30 shrink-0 active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <button onClick={proximoExercicio}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-black text-white bg-black
                       hover:bg-gray-800 active:scale-[0.98] transition-all text-sm shadow-md">
            {exIndex === fichaAtiva.exercicios.length - 1 ? (
              <><Trophy size={16} /> Finalizar Treino</>
            ) : (
              <>Próximo <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: HUB (TELA PRINCIPAL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (fichas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 animate-fade-in">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Dumbbell size={28} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Nenhum Treino Ativo</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Seu treinador ainda está elaborando sua ficha de treinos. Aguarde a liberação.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">

      {/* Header */}
      <header>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Meus Treinos</h1>
      </header>

      {/* ── Hero: Próximo Treino ──────────────────────────────────────── */}
      {fichaProxima && (
        <div className="relative rounded-xl overflow-hidden bg-black text-white shadow-lg">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  <Zap size={10} className="text-yellow-400" /> Próximo Treino
                </span>
                <h2 className="text-2xl font-black text-white leading-none">Treino {fichaProxima.letra}</h2>
                <p className="text-gray-400 font-medium text-xs mt-1">{fichaProxima.nome}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  <span className="flex items-center gap-1 text-gray-500"><Dumbbell size={11} /> {fichaProxima.exercicios.length} exer</span>
                  <span className="flex items-center gap-1 text-gray-500"><Clock size={11} /> {fichaProxima.duracao}</span>
                </div>
              </div>
            </div>
            <button onClick={() => iniciarTreino(fichaProxima)}
              className="flex items-center justify-center gap-2 bg-white text-black font-black py-3.5 rounded-xl text-sm
                         hover:bg-gray-100 active:scale-[0.98] transition-all shadow-md w-full mt-1">
              <Play size={14} fill="black" /> Iniciar Treino
            </button>
          </div>
        </div>
      )}

      {/* ── Métricas 2x2 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Treinados', valor: stats?.dias_treinados_mes ?? '—', icon: Trophy, cor: 'text-yellow-500', sub: 'Mês' },
          { label: 'Sequência', valor: stats?.sequencia_atual != null ? `${stats.sequencia_atual}` : '—', icon: Flame, cor: 'text-orange-500', sub: 'Treinos' },
          { label: 'Meta', valor: stats?.meta_semanal ? `${stats.meta_semanal.feitos}/${stats.meta_semanal.objetivo}` : '—', icon: Target, cor: 'text-emerald-500', sub: 'Semana' },
          { label: 'Volume', valor: stats?.volume_semana != null ? formatVolume(stats.volume_semana) : '—', icon: BarChart3, cor: 'text-blue-500', sub: '7 dias' },
        ].map(({ label, valor, icon: Icon, cor, sub }) => (
          <div key={label} className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col justify-center gap-0.5">
            <div className="flex items-center justify-between mb-0.5">
              <Icon size={13} className={cor} />
              <span className="text-[8px] font-black text-gray-300 uppercase tracking-wider">{sub}</span>
            </div>
            <span className="text-xl font-black text-gray-900 leading-none">{valor}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Fichas: Scroll Horizontal ─────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2.5">Fichas</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          {fichas.map(ficha => {
            const isProximaBadge = ficha.letra === proximaLetraHub;
            const isSelected = ficha.letra === letraAtivaHub;
            return (
              <div key={ficha.id}
                onClick={() => setFichaSelecionada(ficha.letra)}
                className={`snap-start shrink-0 w-[200px] md:w-[220px] bg-white border rounded-xl overflow-hidden transition-all cursor-pointer
                  ${isSelected ? 'border-black ring-1 ring-black shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`h-1 w-full ${isSelected ? 'bg-black' : 'bg-gray-200'}`} />
                <div className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <span className="text-sm font-black text-gray-900">{ficha.letra}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-900 text-xs leading-none truncate">{ficha.nome}</h3>
                      {isProximaBadge && <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase tracking-widest">Próximo</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 text-[9px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Dumbbell size={9} /> {ficha.exercicios.length} exer</span>
                    <span className="flex items-center gap-0.5"><Clock size={9} /> {ficha.duracao}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); iniciarTreino(ficha); }}
                    className="flex items-center justify-center gap-1 py-2 rounded-lg bg-black text-white text-[11px] font-black hover:bg-gray-800 active:scale-95 transition-all mt-0.5">
                    <Play size={10} fill="white" /> Iniciar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Histórico Recente ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Histórico Recente</h2>
          <button onClick={() => setActiveView('historico')}
            className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-black transition">
            Ver tudo <ChevronRight size={12} />
          </button>
        </div>

        {historico.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Nenhum treino realizado ainda. Comece agora!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                  <span className="text-xs font-black">{h.letra}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">{h.nome_dia}</p>
                  <p className="text-[10px] text-gray-400">{DIAS_SEMANA_CURTO[h.dia_semana] || h.dia_semana} · {formatDate(h.data)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-gray-900">{Math.round(h.duracao_seg / 60)}min</p>
                  <p className="text-[10px] text-gray-400">{formatVolume(h.volume_total)}kg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Histórico Completo
// ═══════════════════════════════════════════════════════════════════════════
function HistoricoView({ onBack }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await apiFetch('/workouts/history?limit=90');
        if (data) {
          data.sort((a, b) => {
            const dDiff = new Date(b.data) - new Date(a.data);
            if (dDiff !== 0) return dDiff;
            if (a.hora_fim && b.hora_fim) return b.hora_fim.localeCompare(a.hora_fim);
            return 0;
          });
        }
        setHistorico(data);
      } catch (err) {
        console.error('Erro ao buscar histórico:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Agrupar por semana
  const semanas = historico.reduce((acc, item) => {
    const d = new Date(item.data + 'T12:00:00');
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const diff = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));

    let grupo;
    if (diff < 7) grupo = 'Esta Semana';
    else if (diff < 14) grupo = 'Semana Passada';
    else if (diff < 30) grupo = 'Este Mês';
    else grupo = 'Anteriores';

    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      <header className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Histórico</h1>
          <p className="text-[11px] text-gray-500">{historico.length} treinos registrados</p>
        </div>
      </header>

      {historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-3">
          <History size={32} className="text-gray-300" />
          <p className="text-sm text-gray-500 font-medium">Nenhum treino registrado ainda.</p>
        </div>
      ) : (
        Object.entries(semanas).map(([grupo, items]) => (
          <section key={grupo}>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{grupo}</h2>
            <div className="space-y-2">
              {items.map((h, i) => (
                <div key={h.id || i} className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <span className="text-sm font-black">{h.letra}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">{h.nome_dia}</p>
                      <p className="text-[11px] text-gray-400">{h.dia_semana} · {formatDate(h.data)} · {h.hora_inicio}–{h.hora_fim}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-gray-50">
                    {[
                      { label: 'Duração', valor: `${Math.round(h.duracao_seg / 60)}min` },
                      { label: 'Eficiência', valor: `${Math.round((h.exercicios_feitos / Math.max(1, h.exercicios_total)) * 100)}%` },
                      { label: 'Exercícios', valor: `${h.exercicios_feitos}/${h.exercicios_total}` },
                    ].map(({ label, valor }) => (
                      <div key={label} className="flex-1 text-center">
                        <span className="text-xs font-black text-gray-900 block">{valor}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
