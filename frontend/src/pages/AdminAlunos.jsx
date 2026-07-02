import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Filter, MoreVertical, Edit3, Eye, FileText, X, Clock, Dumbbell, ChevronDown, ChevronUp, CalendarDays, RotateCcw, Check, Trash2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PDFPreviewModal from '../components/pdf/PDFPreviewModal';

// Helper: calcula dias restantes a partir de string "dd/mm/yyyy"
const calcDiasRestantes = (dataTerminoStr) => {
  if (!dataTerminoStr) return null;
  const parts = dataTerminoStr.split('/');
  if (parts.length !== 3) return null;
  const [dia, mes, ano] = parts.map(Number);
  const termino = new Date(ano, mes - 1, dia);
  termino.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((termino - hoje) / (1000 * 60 * 60 * 24));
};

const getDiasRestantesStyle = (dias) => {
  if (dias <= 0) return { dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
  if (dias <= 7) return { dot: 'bg-red-400', text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
  if (dias <= 15) return { dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
  return { dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
};

export default function AdminAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [drawerAluno, setDrawerAluno] = useState(null); // Atleta clicado
  const [fichaAberta, setFichaAberta] = useState(null); // Dados da ficha
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState(null); // Modal de exclusão
  const [loadingExclusao, setLoadingExclusao] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();

  // ── FILTROS ──────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Filtros temporários (editando no painel)
  const [tempObjetivo, setTempObjetivo] = useState([]);
  const [tempStatus, setTempStatus] = useState([]);
  const [tempUrgencia, setTempUrgencia] = useState([]);
  const [tempDataInicio, setTempDataInicio] = useState('');
  const [tempDataFim, setTempDataFim] = useState('');

  // Filtros aplicados (ativos na tabela)
  const [filtroObjetivo, setFiltroObjetivo] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [filtroUrgencia, setFiltroUrgencia] = useState([]);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const objetivoOptions = ['Hipertrofia', 'Emagrecimento', 'Saúde Geral'];
  const statusOptions = [
    { value: 'ATIVO', label: 'Treino Ativo' },
    { value: 'SEM TREINO', label: 'Sem Treino' }
  ];
  const urgenciaOptions = [
    { value: 'Verde', label: 'Em dia (15 dias ou mais)', color: 'bg-emerald-400' },
    { value: 'Amarelo', label: 'Atenção (7 a 15 dias)', color: 'bg-amber-400' },
    { value: 'Vermelho', label: 'Urgente (6 dias ou menos)', color: 'bg-red-400' }
  ];

  // Contador de filtros ativos
  const activeFilterCount = filtroObjetivo.length + filtroStatus.length + filtroUrgencia.length + (filtroDataInicio ? 1 : 0) + (filtroDataFim ? 1 : 0);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ao abrir o painel, sincroniza temporários com os ativos
  const openFilters = () => {
    setTempObjetivo([...filtroObjetivo]);
    setTempStatus([...filtroStatus]);
    setTempUrgencia([...filtroUrgencia]);
    setTempDataInicio(filtroDataInicio);
    setTempDataFim(filtroDataFim);
    setShowFilters(!showFilters);
  };

  const toggleArrayItem = (arr, setArr, value) => {
    setArr(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const aplicarFiltros = () => {
    setFiltroObjetivo([...tempObjetivo]);
    setFiltroStatus([...tempStatus]);
    setFiltroUrgencia([...tempUrgencia]);
    setFiltroDataInicio(tempDataInicio);
    setFiltroDataFim(tempDataFim);
    setShowFilters(false);
  };

  const limparFiltros = () => {
    setTempObjetivo([]);
    setTempStatus([]);
    setTempUrgencia([]);
    setTempDataInicio('');
    setTempDataFim('');
    setFiltroObjetivo([]);
    setFiltroStatus([]);
    setFiltroUrgencia([]);
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setShowFilters(false);
  };

  // ── FIM FILTROS ─────────────────────────────────────────────────────

  const openDrawer = async (aluno) => {
    setDrawerAluno(aluno);
    setFichaAberta(null);
    setLoadingFicha(true);
    try {
      const data = await apiFetch(`/admin/usuarios/${aluno.id}/ficha-ativa`);
      setFichaAberta(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar a ficha: ' + err.message);
    } finally {
      setLoadingFicha(false);
    }
  };

  const closeDrawer = () => {
    setDrawerAluno(null);
    setFichaAberta(null);
  };

  const confirmarExclusao = async () => {
    if (!alunoParaExcluir) return;
    setLoadingExclusao(true);
    try {
      await apiFetch(`/admin/usuarios/${alunoParaExcluir.id}`, { method: 'DELETE' });
      setAlunos(prev => prev.filter(a => a.id !== alunoParaExcluir.id));
      setAlunoParaExcluir(null);
      if (drawerAluno?.id === alunoParaExcluir.id) {
        closeDrawer();
      }
      setToastMessage('Usuário e dados de treino excluídos permanentemente.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir aluno: ' + err.message);
    } finally {
      setLoadingExclusao(false);
    }
  };

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await apiFetch('/admin/usuarios');
        setAlunos(data);
      } catch (err) {
        console.error('Erro ao buscar a lista de usuários', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  // Filtragem combinada: busca + objetivo + status + data
  const alunosFiltrados = alunos.filter(a => {
    // Busca por texto
    const matchBusca = !busca || 
      a.nome?.toLowerCase().includes(busca.toLowerCase()) || 
      a.email?.toLowerCase().includes(busca.toLowerCase());

    // Filtro por objetivo
    const matchObjetivo = filtroObjetivo.length === 0 || 
      filtroObjetivo.some(o => a.objetivo?.toLowerCase() === o.toLowerCase());

    // Filtro por status
    const matchStatus = filtroStatus.length === 0 || 
      filtroStatus.includes(a.status_treino || 'SEM TREINO');

    // Filtro de Urgência (Cores)
    let matchUrgencia = true;
    if (filtroUrgencia.length > 0) {
      if (a.status_treino === 'ATIVO') {
        const diasRest = calcDiasRestantes(a.data_termino);
        if (diasRest !== null) {
          const cor = diasRest > 15 ? 'Verde' : (diasRest >= 7 ? 'Amarelo' : 'Vermelho');
          matchUrgencia = filtroUrgencia.includes(cor);
        } else {
          matchUrgencia = false;
        }
      } else {
        matchUrgencia = false;
      }
    }

    // Filtro por data de cadastro
    let matchData = true;
    if (filtroDataInicio || filtroDataFim) {
      // Tenta extrair a data de cadastro (formato "dd/mm/yyyy" ou similar)
      const raw = a.data_criacao?.split(',')[0]?.split(' ')[0] || '';
      const parts = raw.split('/');
      if (parts.length === 3) {
        const dataCadastro = new Date(parts[2], parts[1] - 1, parts[0]);
        if (filtroDataInicio) {
          matchData = matchData && dataCadastro >= new Date(filtroDataInicio);
        }
        if (filtroDataFim) {
          const fim = new Date(filtroDataFim);
          fim.setHours(23, 59, 59);
          matchData = matchData && dataCadastro <= fim;
        }
      }
    }

    return matchBusca && matchObjetivo && matchStatus && matchUrgencia && matchData;
  });

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      
      {/* Header Area — Fixo no topo */}
      <div className="px-6 lg:px-8 xl:px-10 pt-6 lg:pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Alunos</h1>
            <p className="text-gray-500 font-medium mt-1">Planejamento, Prescrição e Supervisão de Treinamentos</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão Filtros com badge */}
            <div className="relative" ref={filterRef}>
              <button 
                onClick={openFilters}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition shadow-sm ${
                  activeFilterCount > 0 
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} /> Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Painel de Filtros Dropdown */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-48px)] md:w-[380px] max-h-[calc(100vh-180px)] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                  
                  {/* Header do Painel */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Filtros</h3>
                    <button onClick={() => setShowFilters(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    
                    {/* Filtro: Objetivo */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ficha | Objetivo</label>
                      <div className="flex flex-wrap gap-2">
                        {objetivoOptions.map(opt => (
                          <button
                            key={opt}
                            onClick={() => toggleArrayItem(tempObjetivo, setTempObjetivo, opt)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                              tempObjetivo.includes(opt)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {tempObjetivo.includes(opt) && <Check size={12} className="inline mr-1 -mt-0.5" />}
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro: Status */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => toggleArrayItem(tempStatus, setTempStatus, opt.value)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                              tempStatus.includes(opt.value)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {tempStatus.includes(opt.value) && <Check size={12} className="inline mr-1 -mt-0.5" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro: Cores (Urgência) */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ficha (Prazo)</label>
                      <div className="grid grid-cols-1 gap-2">
                        {urgenciaOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => toggleArrayItem(tempUrgencia, setTempUrgencia, opt.value)}
                            className={`px-4 py-2.5 flex items-center justify-between rounded-xl text-xs font-bold transition border ${
                              tempUrgencia.includes(opt.value)
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md ring-2 ring-gray-900/10'
                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${opt.color} shadow-sm`}></span>
                              <span>{opt.label}</span>
                            </div>
                            {tempUrgencia.includes(opt.value) && <Check size={14} className="text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro: Data */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        <CalendarDays size={12} className="inline mr-1 -mt-0.5" /> Período de Cadastro
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 mb-1 ml-1">De</span>
                          <input 
                            type="date" 
                            value={tempDataInicio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempDataInicio(val);
                              if (val) {
                                // Split manual para evitar problemas de fuso horário (Timezone shift)
                                const [year, month, day] = val.split('-').map(Number);
                                // Obtém o último dia do mês selecionado (usando o mês seguinte e dia 0)
                                const lastDay = new Date(year, month, 0);
                                const y = lastDay.getFullYear();
                                const m = String(lastDay.getMonth() + 1).padStart(2, '0');
                                const d = String(lastDay.getDate()).padStart(2, '0');
                                setTempDataFim(`${y}-${m}-${d}`);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-gray-400 mb-1 ml-1">Até</span>
                          <input 
                            type="date" 
                            value={tempDataFim}
                            onChange={(e) => setTempDataFim(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-gray-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer do Painel */}
                  <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 shrink-0">
                    <button 
                      onClick={limparFiltros}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition"
                    >
                      <RotateCcw size={13} /> Limpar Filtros
                    </button>
                    <button 
                      onClick={aplicarFiltros}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition shadow-md active:scale-95"
                    >
                      <Check size={14} /> Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Caixa de Pesquisa */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <Search size={20} className="text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="Buscar pelo nome ou e-mail de um atleta específico..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-medium text-gray-700 text-sm placeholder-gray-400 p-1"
          />
        </div>
      </div>

      {/* Data Grid / Tabela — Scroll interno independente */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 xl:px-10 pb-6 lg:pb-8">
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
          {/* Cabeçalho da tabela — Fixo (Apenas Desktop) */}
          <div className="flex-shrink-0 overflow-x-auto hidden lg:block">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
                  <th className="px-6 py-4 w-[35%]">Aluno & Contato</th>
                  <th className="px-6 py-4 w-[20%]">Objetivo</th>
                  <th className="px-6 py-4 w-[15%]">Status</th>
                  <th className="px-6 py-4 w-[20%] text-center">Início Cadastro</th>
                  <th className="px-6 py-4 text-center">Prescrever</th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Corpo da tabela — Scroll (Apenas Desktop) */}
          <div className="flex-1 overflow-y-auto overflow-x-auto hidden lg:block">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <tbody className="divide-y divide-gray-100/60">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">Carregando banco biológico...</td>
                  </tr>
                ) : alunosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">Nenhum atleta encontrado na base de dados.</td>
                  </tr>
                ) : (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-gray-50/80 transition-all duration-300 group">
                      {/* INFO ATLETA */}
                      <td className="px-6 py-4 w-[35%]">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-100 via-blue-50 to-white border border-blue-200/60 flex items-center justify-center text-blue-700 font-black text-base shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                             {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="text-[14px] font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                              {aluno.nome || 'Sem Nome'}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">{aluno.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* DADOS FÍSICOS/MÉDICOS */}
                      <td className="px-6 py-4 w-[20%]">
                        {aluno.objetivo ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] uppercase tracking-widest font-black bg-gray-900 text-white shadow-sm w-fit">
                              {aluno.objetivo}
                            </span>
                            <span className="text-[11px] font-medium text-gray-500">{aluno.idade || '--'} anos • {aluno.peso ? `${aluno.peso}kg` : ''} • Nível: {aluno.nivel_fisico}</span>
                          </div>
                        ) : (
                          <span className="inline-block bg-amber-50 text-amber-600 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border border-amber-200/50">
                            Pendente Anamnese
                          </span>
                        )}
                      </td>

                      {/* STATUS TREINO */}
                      <td className="px-6 py-4 w-[15%]">
                        {aluno.status_treino === 'ATIVO' ? (() => {
                          const diasRest = calcDiasRestantes(aluno.data_termino);
                          const hasDuracao = diasRest !== null;
                          const style = hasDuracao ? getDiasRestantesStyle(diasRest) : null;
                          const dotColor = style?.dot || 'bg-emerald-400';
                          const badgeBg = style?.bg || 'bg-emerald-50';
                          const badgeBorder = style?.border || 'border-emerald-100';
                          const diasText = style?.text || 'text-emerald-600';

                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center whitespace-nowrap gap-1.5 text-[10px] font-black uppercase tracking-widest ${badgeBg} px-3 py-1.5 rounded-full border ${badgeBorder} w-fit`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                <span className="text-gray-700">Ativo</span>
                                {hasDuracao && (
                                  <>
                                    <span className="text-gray-300">–</span>
                                    <span className={`${diasText} font-black`}>
                                      {diasRest <= 0 ? 'Expirada' : `${diasRest} dias`}
                                    </span>
                                  </>
                                )}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 truncate max-w-[140px]">{aluno.ficha_nome}</span>
                            </div>
                          );
                        })() : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Sem Treino
                          </span>
                        )}
                      </td>

                      {/* DATA INSCRIÇÃO */}
                      <td className="px-6 py-4 text-center w-[20%]">
                         <span className="text-xs font-bold text-gray-400">{aluno.data_criacao ? aluno.data_criacao.split(',')[0].split(' ')[0] : '--'}</span>
                      </td>

                      {/* AÇÕES */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {aluno.status_treino === 'ATIVO' ? (
                            <button 
                              onClick={() => openDrawer(aluno)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-100 transition active:scale-95 shrink-0"
                              title="Ver Ficha Ativa"
                            >
                              <Eye size={16} />
                            </button>
                          ) : (
                            <div className="w-9 h-9 shrink-0"></div>
                          )}
                          <button 
                            onClick={() => navigate(`/admin/prescricao/${aluno.id}`)}
                            className="flex justify-center items-center gap-1.5 bg-black text-white w-[90px] py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-gray-800 transition active:scale-95 shadow-md"
                          >
                            <FileText size={11} fill="white" /> {aluno.status_treino === 'ATIVO' ? 'Editar' : 'Ficha'}
                          </button>
                          <button
                            onClick={() => setAlunoParaExcluir(aluno)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-500 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-95 shrink-0"
                            title="Excluir Aluno"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Corpo em Cards (Apenas Mobile) */}
          <div className="flex-1 overflow-y-auto block lg:hidden p-4 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-gray-400 font-bold">Carregando banco biológico...</div>
            ) : alunosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-bold">Nenhum atleta encontrado na base de dados.</div>
            ) : (
              alunosFiltrados.map((aluno) => {
                const isAtivo = aluno.status_treino === 'ATIVO';
                const diasRest = calcDiasRestantes(aluno.data_termino);
                const hasDuracao = diasRest !== null;
                const style = hasDuracao ? getDiasRestantesStyle(diasRest) : null;
                
                return (
                  <div key={aluno.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                    {/* Header do Card (Avatar + Info) */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 via-blue-50 to-white border border-blue-200/60 flex items-center justify-center text-blue-700 font-black text-sm shadow-sm shrink-0">
                         {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-gray-900 truncate">
                          {aluno.nome || 'Sem Nome'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium truncate">{aluno.email}</div>
                      </div>
                      <button
                        onClick={() => setAlunoParaExcluir(aluno)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-500 active:scale-95 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Tags e Dados */}
                    <div className="flex flex-wrap gap-2">
                      {aluno.objetivo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] uppercase tracking-widest font-black bg-gray-900 text-white shadow-sm">
                          {aluno.objetivo}
                        </span>
                      ) : (
                        <span className="inline-flex bg-amber-50 text-amber-600 text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md border border-amber-200/50">
                          Pend. Anamnese
                        </span>
                      )}
                      
                      {isAtivo ? (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${style?.bg || 'bg-emerald-50'} px-2 py-1 rounded-md border ${style?.border || 'border-emerald-100'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style?.dot || 'bg-emerald-400'}`}></span>
                          {hasDuracao && diasRest <= 0 ? 'Expirada' : 'Ativo'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                          Sem Treino
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-500 font-medium">
                      {aluno.idade || '--'} anos • {aluno.peso ? `${aluno.peso}kg` : ''} • Nível: {aluno.nivel_fisico}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 mt-2 pt-4 border-t border-gray-50">
                      {isAtivo && (
                        <button 
                          onClick={() => openDrawer(aluno)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-500 active:scale-95 shrink-0"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/admin/prescricao/${aluno.id}`)}
                        className="flex-1 flex justify-center items-center gap-2 bg-black text-white h-10 rounded-xl text-[10px] uppercase tracking-widest font-black active:scale-95 shadow-md"
                      >
                        <FileText size={12} fill="white" /> {isAtivo ? 'Editar Ficha' : 'Nova Ficha'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* ── DRAWER DE VISUALIZAÇÃO DE FICHA ───────────────────────────────── */}
      {drawerAluno && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-left flex flex-col border-l border-gray-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{drawerAluno.nome}</h3>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  {drawerAluno.ficha_nome || 'Ficha de Treinamento'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={() => setShowPDF(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:text-white hover:bg-blue-500 transition"
                  >
                    <FileText size={15} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                    <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      Gerar PDF
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAlunoParaExcluir(drawerAluno)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:text-white hover:bg-red-500 transition"
                  title="Excluir Aluno"
                >
                  <Trash2 size={15} />
                </button>
                <button 
                  onClick={closeDrawer}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFicha ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                  <span className="text-sm font-bold text-gray-400">Extraindo matriz...</span>
                </div>
              ) : fichaAberta && fichaAberta.length > 0 ? (
                <div className="space-y-6">
                  {fichaAberta.map((dia) => (
                    <div key={dia.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-lg font-black shadow-md">
                            {dia.letra}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-sm">{dia.nome}</h4>
                            <div className="flex gap-2 text-[10px] font-bold text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1"><Dumbbell size={10}/> {dia.exercicios.length} exer</span>
                              <span className="flex items-center gap-1"><Clock size={10}/> {dia.duracao}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {dia.exercicios.map((ex, i) => (
                          <div key={ex.id} className="px-5 py-3 hover:bg-gray-50/50 flex items-center justify-between gap-4 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-black text-gray-900 truncate">
                                {i + 1}. {ex.nome}
                              </p>
                            </div>
                            <div className="flex gap-4 text-center shrink-0">
                               <div className="w-12">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Séries</p>
                                 <p className="text-xs font-black text-gray-900">{ex.series}</p>
                               </div>
                               <div className="w-12">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Reps</p>
                                 <p className="text-xs font-black text-gray-900">{ex.reps}</p>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 font-bold">Nenhuma matriz estruturada encontrada.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => navigate(`/admin/prescricao/${drawerAluno.id}`)}
                className="w-full bg-black text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95 shadow-lg"
              >
                <Edit3 size={16} /> Modificar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF Preview */}
      <PDFPreviewModal
        isOpen={showPDF}
        onClose={() => setShowPDF(false)}
        aluno={drawerAluno}
        profissional={adminUser ? { nome: adminUser.nome, email: adminUser.email } : null}
        treinos={fichaAberta?.map(dia => ({
          letra: dia.letra_dia,
          nome: dia.foco_muscular,
          foco_muscular: dia.foco_muscular,
          objetivo: drawerAluno?.objetivo,
          exercicios: dia.exercicios
        })) || []}
      />

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ──────────────────────────────── */}
      {alunoParaExcluir && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !loadingExclusao && setAlunoParaExcluir(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 tracking-tight mb-2">Excluir Aluno?</h3>
            <p className="text-sm font-medium text-gray-500 text-center mb-6 leading-relaxed">
              Você está prestes a apagar <strong className="text-gray-900">{alunoParaExcluir.nome}</strong>. Esta ação <strong>deletará todas as fichas, histórico e dados de treino permanentemente</strong> da base de dados e não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmarExclusao}
                disabled={loadingExclusao}
                className="w-full bg-red-500 text-white font-black py-3.5 rounded-xl uppercase tracking-widest text-xs hover:bg-red-600 transition active:scale-95 disabled:opacity-50"
              >
                {loadingExclusao ? 'Excluindo dados...' : 'Sim, Excluir Definitivamente'}
              </button>
              <button
                onClick={() => setAlunoParaExcluir(null)}
                disabled={loadingExclusao}
                className="w-full bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl text-xs hover:bg-gray-100 transition active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST DE SUCESSO ────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-[300] animate-slide-up">
          <div className="bg-emerald-500 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 font-medium text-sm tracking-wide">
            <div className="w-6 h-6 rounded-full bg-emerald-400/50 flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" />
            </div>
            {toastMessage}
          </div>
        </div>
      )}

    </div>
  );
}
