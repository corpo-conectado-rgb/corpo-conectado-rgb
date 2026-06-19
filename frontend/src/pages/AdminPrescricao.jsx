import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, BrainCircuit, Dumbbell, AlertTriangle, Activity, User, PlusCircle, Trash, Trash2, X, CalendarDays, MinusCircle, Briefcase, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';
import AssistenteIA from '../components/AssistenteIA';

export default function AdminPrescricao() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const GRUPOS_MUSCULARES = [
    { cat: 'Superiores', itens: ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Antebraço'] },
    { cat: 'Inferiores', itens: ['Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha'] },
    { cat: 'Core / Outros', itens: ['Abdômen', 'Cardio', 'Full Body'] }
  ];

  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuAbertoDiaIdx, setMenuAbertoDiaIdx] = useState(null);
  const [toast, setToast] = useState(null);
  const [assistenteOpen, setAssistenteOpen] = useState(false);

  // Estados do Formulário Master
  const [nomeFicha, setNomeFicha] = useState('Projeto Hipertrofia 1.0');
  const [tipoDivisao, setTipoDivisao] = useState('A/B/C');
  const [focoMacro, setFocoMacro] = useState('Hipertrofia Moderna');
  const [duracaoDias, setDuracaoDias] = useState(30);

  // Helper: Calcula data de término a partir de hoje + N dias
  const calcDataTermino = (dias) => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + Number(dias));
    return hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const DURACAO_PRESETS = [30, 60, 90];

  // Dias da Matriz
  const [diasTreino, setDiasTreino] = useState([
    { letra_dia: 'A', foco_muscular: 'Peito, Ombro e Tríceps', exercicios: [] }
  ]);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // 1. Buscar Aluno
        const alunoData = await apiFetch(`/admin/usuarios/${id}`);
        setAluno(alunoData);

        // 2. Buscar Ficha Ativa (se existir)
        const fichaAtiva = await apiFetch(`/admin/fichas/usuario/${id}/builder`);
        if (fichaAtiva) {
          setNomeFicha(fichaAtiva.nome_ficha);
          setTipoDivisao(fichaAtiva.tipo_divisao);
          setFocoMacro(fichaAtiva.objetivo);
          if (fichaAtiva.duracao_dias) setDuracaoDias(Number(fichaAtiva.duracao_dias));
          if (fichaAtiva.dias && fichaAtiva.dias.length > 0) {
            setDiasTreino(fichaAtiva.dias);
          }
        }
      } catch (err) {
        console.error("Erro no fetchDados:", err);
        setToast({ 
          message: 'Não foi possível carregar os dados da ficha. Tente novamente.', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [id]);

  const handleAddDia = () => {
    const nextLetras = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLetra = nextLetras[diasTreino.length] || 'X';
    setDiasTreino([...diasTreino, { letra_dia: nextLetra, foco_muscular: '', exercicios: [] }]);
  };

  const toggleFoco = (diaIdx, musculo) => {
    const focoString = diasTreino[diaIdx].foco_muscular || '';
    let arr = focoString ? focoString.split(',').map(s=>s.trim()).filter(Boolean) : [];
    
    if (arr.includes(musculo)) {
      arr = arr.filter(m => m !== musculo);
    } else {
      arr.push(musculo);
    }

    const novos = [...diasTreino];
    novos[diaIdx].foco_muscular = arr.join(', ');
    setDiasTreino(novos);
  };

  const addExercicio = (diaIndex) => {
    const novosDias = [...diasTreino];
    novosDias[diaIndex].exercicios.push({
      nome: '', series: 3, repeticoes: '10-12', descanso: 60, carga: '', observacoes: ''
    });
    setDiasTreino(novosDias);
  };

  const updateEx = (diaIdx, exIdx, campo, valor) => {
    const novosDias = [...diasTreino];
    novosDias[diaIdx].exercicios[exIdx][campo] = valor;
    setDiasTreino(novosDias);
  };

  const removerEx = (diaIdx, exIdx) => {
    const novosDias = [...diasTreino];
    novosDias[diaIdx].exercicios.splice(exIdx, 1);
    setDiasTreino(novosDias);
  }

  const removerDia = (diaIdx) => {
    const novosDias = [...diasTreino];
    novosDias.splice(diaIdx, 1);
    const nextLetras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    novosDias.forEach((dia, idx) => {
      dia.letra_dia = nextLetras[idx] || 'X';
    });
    setDiasTreino(novosDias);
  };

  const salvarPrescricao = async () => {
    try {
      setSalvando(true);
      await apiFetch('/admin/fichas', {
        method: 'POST',
        body: JSON.stringify({
          user_id: id,
          nome_ficha: nomeFicha,
          tipo_divisao: tipoDivisao,
          objetivo: focoMacro,
          duracao_dias: String(duracaoDias),
          data_termino: calcDataTermino(duracaoDias),
          dias: diasTreino
        })
      });
      setToast({ message: 'Prescrição salva com sucesso!', type: 'success' });
      setTimeout(() => navigate('/admin/alunos'), 2500);
    } catch (err) {
      setToast({ message: 'Falha ao salvar a prescrição. Tente novamente.', type: 'error' });
    } finally {
      setSalvando(false);
    }
  };

  // Handler para ações vindas do Assistente IA (ex: injetar exercícios na ficha)
  const handleApplyIAAction = (action) => {
    if (action.tipo === 'gerar_exercicios' && action.dias) {
      const novosDias = [...diasTreino];
      const nextLetras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      for (const diaSugerido of action.dias) {
        // Procura se já existe um dia com essa letra
        const idx = novosDias.findIndex(d => d.letra_dia === diaSugerido.letra_dia);
        if (idx !== -1) {
          // Adiciona exercícios ao dia existente
          const exsFormatados = (diaSugerido.exercicios || []).map(ex => ({
            nome: ex.nome || '',
            series: ex.series || 3,
            repeticoes: ex.repeticoes || '10-12',
            descanso: ex.descanso || 60,
            carga: '',
            observacoes: ex.observacoes || ''
          }));
          novosDias[idx].exercicios = [...novosDias[idx].exercicios, ...exsFormatados];
          if (diaSugerido.foco_muscular && !novosDias[idx].foco_muscular) {
            novosDias[idx].foco_muscular = diaSugerido.foco_muscular;
          }
        } else {
          // Cria novo dia
          novosDias.push({
            letra_dia: diaSugerido.letra_dia || nextLetras[novosDias.length] || 'X',
            foco_muscular: diaSugerido.foco_muscular || '',
            exercicios: (diaSugerido.exercicios || []).map(ex => ({
              nome: ex.nome || '',
              series: ex.series || 3,
              repeticoes: ex.repeticoes || '10-12',
              descanso: ex.descanso || 60,
              carga: '',
              observacoes: ex.observacoes || ''
            }))
          });
        }
      }

      setDiasTreino(novosDias);
      setToast({ message: 'Treino gerado pela IA aplicado com sucesso! ✨', type: 'success' });
    }
  };

  if (loading) return <div className="p-12 text-center font-bold text-gray-500">Decodificando dados estruturais...</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full -m-6 p-6 md:p-8 animate-fade-in bg-[#FAFAFA]">
      
      {/* Toast de Feedback */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Header Fixo Desktop */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Estúdio de Prescrição
            </h1>
            <p className="text-gray-500 font-medium text-xs md:text-sm mt-0.5">Modelagem e design de treinamento clínico para {aluno?.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button 
            onClick={() => setAssistenteOpen(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3.5 rounded-xl font-black hover:bg-purple-700 transition shadow-lg"
          >
            <Briefcase size={16} /> Alfred
          </button>
          <button 
            onClick={salvarPrescricao}
            disabled={salvando}
            className="flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-xl font-black hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
          >
            {salvando ? 'Compilando...' : <><Save size={18} /> Salvar Prescrição</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA: Copiloto e Info Base */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Atleta Mini */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
               <User size={80} />
             </div>
             <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Informações</h2>
             
             <div className="space-y-3">
               <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nível</p><p className="font-black text-sm text-gray-900">{aluno?.nivel_fisico || 'N/A'}</p></div>
               <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Freq. Semanal</p><p className="font-black text-sm text-gray-900">{aluno?.habitos_freq || 'N/A'}</p></div>
               <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Objetivo Base</p><p className="font-black text-sm text-blue-600">{aluno?.objetivo || 'N/A'}</p></div>
               <div className="grid grid-cols-2 gap-2 mt-2 border-t border-gray-100 pt-3">
                 <div><p className="text-[10px] text-gray-400 font-bold uppercase">Peso</p><p className="font-black text-sm">{aluno?.peso ? `${aluno.peso}kg` : '--'}</p></div>
                 <div><p className="text-[10px] text-gray-400 font-bold uppercase">Idade</p><p className="font-black text-sm">{aluno?.idade || '--'}</p></div>
               </div>
             </div>
          </div>

        </div>

        {/* COLUNA DIREITA/CENTRO: Builder Studio */}
        <div className="lg:col-span-3 space-y-6">
          {/* Config. Globais da Ficha */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
             <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Arquitetura Master da Ficha</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Nome Comercial</label>
                  <input type="text" value={nomeFicha} onChange={e=>setNomeFicha(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-black outline-none transition" />
               </div>
               <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Divisão / Layout</label>
                  <select value={tipoDivisao} onChange={e=>setTipoDivisao(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-black outline-none transition appearance-none">
                    <option>A/B</option><option>A/B/C</option><option>A/B/C/D</option><option>Full Body</option><option>Upper/Lower</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Macro Objetivo</label>
                  <input type="text" value={focoMacro} onChange={e=>setFocoMacro(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-black outline-none transition" />
               </div>
             </div>

             {/* Duração da Ficha */}
             <div className="col-span-1 md:col-span-3 mt-2 pt-5 border-t border-gray-100">
               <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-3">Duração da Ficha</label>
               <div className="flex flex-wrap items-center gap-2">
                 {DURACAO_PRESETS.map(d => (
                   <button
                     key={d}
                     type="button"
                     onClick={() => setDuracaoDias(d)}
                     className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                       duracaoDias === d
                         ? 'bg-black text-white border-black shadow-md'
                         : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                     }`}
                   >
                     {d} dias
                   </button>
                 ))}
                 <div className="flex items-center gap-1.5 ml-1">
                   <input
                     type="number"
                     min="1"
                     max="365"
                     value={duracaoDias}
                     onChange={(e) => setDuracaoDias(Math.max(1, Number(e.target.value) || 1))}
                     className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 text-center focus:border-black outline-none transition"
                   />
                   <span className="text-xs font-bold text-gray-400">dias</span>
                 </div>
               </div>
               <p className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-gray-400">
                 <CalendarDays size={13} className="text-gray-400" />
                 Término estimado: <span className="text-gray-700 font-bold">{calcDataTermino(duracaoDias)}</span>
               </p>
             </div>
          </div>

          {/* Builder de Dias x Exercicio */}
          <div className="space-y-6">
            {diasTreino.map((dia, diaIdx) => {
              const focosAtuais = dia.foco_muscular ? dia.foco_muscular.split(',').map(s=>s.trim()).filter(Boolean) : [];
              return (
              <div key={diaIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible relative group">
                <div className="bg-[#FAFAFA] border-b border-gray-100 p-5 flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                  <div className="flex flex-wrap items-center gap-2 flex-1 relative">
                     <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md mr-2 shrink-0">{dia.letra_dia}</div>
                     
                     {/* Badges Render */}
                     {focosAtuais.map(musculo => (
                        <div key={musculo} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs font-black shadow-sm">
                          {musculo}
                          <button onClick={() => toggleFoco(diaIdx, musculo)} className="text-blue-400 hover:text-blue-800 transition">
                            <X size={12} />
                          </button>
                        </div>
                     ))}

                     {/* Botão de Add Foco */}
                     <button 
                       onClick={() => setMenuAbertoDiaIdx(menuAbertoDiaIdx === diaIdx ? null : diaIdx)}
                       className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-black transition flex items-center gap-1 text-[11px] font-black uppercase tracking-widest shrink-0"
                     >
                       <PlusCircle size={14} /> Foco
                     </button>

                     {/* Popover de Grupos Musculares */}
                     {menuAbertoDiaIdx === diaIdx && (
                        <div className="absolute top-12 left-12 w-[320px] bg-white border border-gray-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] z-[100] p-4 animate-fade-in cursor-default">
                           {GRUPOS_MUSCULARES.map((categoria, cIdx) => (
                             <div key={cIdx} className="mb-4 last:mb-0">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">{categoria.cat}</p>
                               <div className="flex flex-wrap gap-1.5">
                                 {categoria.itens.map(item => {
                                   const isSelected = focosAtuais.includes(item);
                                   return (
                                     <button
                                       key={item}
                                       onClick={() => toggleFoco(diaIdx, item)}
                                       className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition border ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                     >
                                       {item}
                                     </button>
                                   )
                                 })}
                               </div>
                             </div>
                           ))}
                           <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
                             <span className="text-[10px] text-gray-400 font-medium">Auto-salvamento em String</span>
                             <button onClick={() => setMenuAbertoDiaIdx(null)} className="text-[10px] uppercase font-black tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition">Concluído</button>
                           </div>
                        </div>
                     )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => addExercicio(diaIdx)} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                      <PlusCircle size={14} /> Injetar
                    </button>
                    <button onClick={() => removerDia(diaIdx)} className="flex items-center justify-center w-[34px] h-[34px] text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition opacity-0 group-hover:opacity-100 shadow-sm" title="Excluir Dia de Treino">
                      <MinusCircle size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {dia.exercicios.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <span className="text-gray-400 font-bold text-sm">Matriz vazia. Clique em injetar para desenhar o treino.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dia.exercicios.map((ex, exIdx) => (
                        <div key={exIdx} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl pt-4 relative group">
                           
                           {/* Botão de excluir ex. */}
                           <button onClick={()=>removerEx(diaIdx, exIdx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                             <Trash2 size={12} />
                           </button>

                           <div className="flex items-center justify-center font-black text-sm w-6 text-gray-400">{exIdx + 1}</div>
                           <input type="text" placeholder="Nome da Máquina/Técnica" value={ex.nome} onChange={e=>updateEx(diaIdx, exIdx, 'nome', e.target.value)} className="flex-[3] bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-black text-gray-900 outline-none min-w-[200px]" />
                           <div className="flex gap-2 flex-1 w-full relative">
                             <input type="number" placeholder="Séries" value={ex.series} onChange={e=>updateEx(diaIdx, exIdx, 'series', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-bold placeholder-gray-400" />
                             <input type="text" placeholder="Reps" value={ex.repeticoes} onChange={e=>updateEx(diaIdx, exIdx, 'repeticoes', e.target.value)} className="w-[80px] bg-white border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-bold placeholder-gray-400" />
                             <input type="number" placeholder="Desc.(s)" value={ex.descanso} onChange={e=>updateEx(diaIdx, exIdx, 'descanso', e.target.value)} className="w-[80px] bg-white border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-bold placeholder-gray-400" />
                           </div>
                           <input type="text" placeholder="Drop-set, 2 steps..." value={ex.observacoes} onChange={e=>updateEx(diaIdx, exIdx, 'observacoes', e.target.value)} className="flex-[2] bg-transparent border-b border-gray-200 rounded-none px-2 py-2.5 text-xs font-medium text-gray-500 outline-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )})}

            <button onClick={handleAddDia} className="w-full border-2 border-dashed border-gray-200 text-gray-500 font-black text-sm uppercase tracking-widest py-6 rounded-2xl hover:border-black hover:text-black hover:bg-gray-50 transition flex items-center justify-center gap-2">
               <PlusCircle size={18} /> Acoplar Novo Dia de Treino
            </button>
          </div>
        </div>
      </div>

      {/* --- Assistente IA Consultivo (Drawer) --- */}
      <AssistenteIA
        isOpen={assistenteOpen}
        onClose={() => setAssistenteOpen(false)}
        alunoId={id}
        alunoNome={aluno?.nome || 'Aluno'}
        onApplyAction={handleApplyIAAction}
      />
    </div>
  );
}
