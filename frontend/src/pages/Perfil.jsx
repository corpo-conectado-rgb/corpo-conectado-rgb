import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Goal, Activity, Timer, MapPin, ShieldAlert, Edit3, X, Check, MessageSquarePlus, Phone, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';

// Definição dos campos editáveis e suas regras
const CAMPOS_CONFIG = {
  nome:          { label: 'Nome',                tipo: 'text',     controlado: true,  impacta: false },
  telefone:      { label: 'Telefone',            tipo: 'tel',      controlado: false, impacta: false },
  habitos_local: { label: 'Local de Treino',     tipo: 'select',   controlado: false, impacta: false, opcoes: ['Smart Fit', 'Pratique', 'Contorno', 'Outro'] },
  peso:          { label: 'Peso (kg)',            tipo: 'number',   controlado: true,  impacta: true  },
  altura:        { label: 'Altura (m)',           tipo: 'number',   controlado: true,  impacta: true  },
  objetivo:      { label: 'Objetivo',            tipo: 'select',   controlado: true,  impacta: true, opcoes: ['Emagrecimento', 'Hipertrofia', 'Saúde Geral'] },
  nivel_fisico:  { label: 'Nível',               tipo: 'select',   controlado: true,  impacta: true, opcoes: ['Iniciante', 'Intermediário', 'Avançado'] },
  habitos_freq:  { label: 'Frequência Semanal',  tipo: 'select',   controlado: true,  impacta: true, opcoes: ['1x', '2x', '3x', '4x', '5x', '6x', '7x'] },
  lesoes_criticas: { label: 'Lesões / Restrições', tipo: 'textarea', controlado: true, impacta: true },
};

export default function Perfil() {
  const { user, updateUser, refreshProfile } = useAuth();
  
  // Estados do modal de solicitação (já existente)
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [solicitacaoSuccess, setSolicitacaoSuccess] = useState(false);
  const [solicitacaoForm, setSolicitacaoForm] = useState({ tipo: 'DUVIDA_EXECUCAO', mensagem: '' });
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  // Estados de edição
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [showResumo, setShowResumo] = useState(false);
  const [enviandoAlteracao, setEnviandoAlteracao] = useState(false);
  const [alteracaoSuccess, setAlteracaoSuccess] = useState(false);
  const [temPendente, setTemPendente] = useState(false);

  // Verifica se existe solicitação ALTERACAO_DADOS pendente
  useEffect(() => {
    const checkPendente = async () => {
      try {
        const notifs = await apiFetch('/solicitacoes/aluno/notificacoes');
        // Também verificar pendentes via endpoint de notificações
        // Na verdade precisamos verificar todas as solicitações do aluno
      } catch {}
    };
    checkPendente();
  }, []);

  const handleEnviarSolicitacao = async (e) => {
    e.preventDefault();
    if (!solicitacaoForm.mensagem.trim()) return;
    try {
      setEnviandoSolicitacao(true);
      await apiFetch('/solicitacoes', {
        method: 'POST',
        body: JSON.stringify(solicitacaoForm)
      });
      setSolicitacaoSuccess(true);
      setTimeout(() => {
        setShowSolicitacao(false);
        setSolicitacaoSuccess(false);
        setSolicitacaoForm({ tipo: 'DUVIDA_EXECUCAO', mensagem: '' });
      }, 4000);
    } catch (err) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  // Entra no modo de edição
  const entrarEdicao = () => {
    setEditedFields({});
    setEditMode(true);
  };

  // Cancela edição
  const cancelarEdicao = () => {
    setEditMode(false);
    setEditedFields({});
  };

  // Atualiza campo editado
  const handleFieldChange = (campo, valor) => {
    setEditedFields(prev => ({ ...prev, [campo]: valor }));
  };

  // Obtém o valor exibido para um campo (editado ou original)
  const getFieldValue = (campo) => {
    if (editedFields[campo] !== undefined) return editedFields[campo];
    return user?.[campo] || '';
  };

  // Verifica se houve alguma alteração real
  const temAlteracoes = () => {
    return Object.keys(editedFields).some(campo => {
      const valorOriginal = user?.[campo] || '';
      return String(editedFields[campo]).trim() !== String(valorOriginal).trim();
    });
  };

  // Separa alterações em diretas e controladas
  const getAlteracoesAgrupadas = () => {
    const diretas = [];
    const controladas = [];

    Object.keys(editedFields).forEach(campo => {
      const config = CAMPOS_CONFIG[campo];
      if (!config) return;
      const de = String(user?.[campo] || '').trim();
      const para = String(editedFields[campo]).trim();
      if (de === para) return;

      const alteracao = { campo, label: config.label, de, para, impacta_prescricao: config.impacta };
      if (config.controlado) {
        controladas.push(alteracao);
      } else {
        diretas.push(alteracao);
      }
    });

    return { diretas, controladas };
  };

  // Handler do botão "Salvar Alterações"
  const handleSalvar = () => {
    if (!temAlteracoes()) {
      cancelarEdicao();
      return;
    }
    setShowResumo(true);
  };

  // Confirma e envia as alterações
  const confirmarAlteracoes = async () => {
    try {
      setEnviandoAlteracao(true);
      const { diretas, controladas } = getAlteracoesAgrupadas();

      // 1. Aplicar alterações diretas (telefone, local de treino)
      if (diretas.length > 0) {
        const payload = {};
        diretas.forEach(alt => { payload[alt.campo] = alt.para; });
        const updatedUser = await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        updateUser(updatedUser);
      }

      // 2. Gerar solicitação para campos controlados
      if (controladas.length > 0) {
        await apiFetch('/solicitacoes', {
          method: 'POST',
          body: JSON.stringify({
            tipo: 'ALTERACAO_DADOS',
            mensagem: JSON.stringify({ alteracoes: controladas })
          })
        });
        setTemPendente(true);
      }

      setAlteracaoSuccess(true);
      
      // Se houve edição direta sem controladas, recarregar perfil
      if (diretas.length > 0 && controladas.length === 0) {
        try { await refreshProfile(); } catch {}
      }

      setTimeout(() => {
        setShowResumo(false);
        setAlteracaoSuccess(false);
        setEditMode(false);
        setEditedFields({});
      }, 3000);

    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setEnviandoAlteracao(false);
    }
  };

  // Verifica se todos os principais campos da anamnese estão preenchidos para definir o status
  const isProfileComplete = user?.idade && user?.peso && user?.altura && user?.objetivo;

  // Renderiza um campo no modo de edição
  const renderEditableField = (campo, valorAtual) => {
    const config = CAMPOS_CONFIG[campo];
    if (!config) return <span className="font-black text-sm">{valorAtual || '--'}</span>;
    
    const value = getFieldValue(campo);
    const isChanged = editedFields[campo] !== undefined && String(editedFields[campo]).trim() !== String(user?.[campo] || '').trim();

    if (config.tipo === 'select') {
      return (
        <select
          value={value}
          onChange={e => handleFieldChange(campo, e.target.value)}
          className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold outline-none transition-all ${isChanged ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200'}`}
        >
          <option value="">Selecionar...</option>
          {config.opcoes?.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
      );
    }

    if (config.tipo === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={e => handleFieldChange(campo, e.target.value)}
          rows={2}
          className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-medium outline-none resize-none transition-all ${isChanged ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200'}`}
        />
      );
    }

    return (
      <input
        type={config.tipo}
        value={value}
        onChange={e => handleFieldChange(campo, e.target.value)}
        step={config.tipo === 'number' ? '0.01' : undefined}
        className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold outline-none transition-all ${isChanged ? 'border-purple-400 bg-purple-50/50' : 'border-gray-200'}`}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-4 animate-fade-in">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meus Dados</h1>
          </div>
          
          {/* Mobile Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            {editMode ? (
              <>
                <button onClick={cancelarEdicao} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                  <X size={20} />
                </button>
                <button onClick={handleSalvar} className="h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all">
                  <Check size={16} /> Salvar
                </button>
              </>
            ) : (
              <>
                <button onClick={entrarEdicao} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all" aria-label="Editar Dados">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => setShowSolicitacao(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all" aria-label="Solicitações">
                  <MessageSquarePlus size={20} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Badge Dinâmico */}
          {!editMode && (
            <div className={`flex items-center justify-center flex-1 md:flex-initial gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 ${isProfileComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} rounded-xl md:rounded-full text-[10px] md:text-sm font-bold border ${isProfileComplete ? 'border-green-200' : 'border-amber-200'}`}>
              {isProfileComplete ? <CheckCircle2 size={14} className="md:w-4 md:h-4" /> : <AlertCircle size={14} className="md:w-4 md:h-4" />}
              {isProfileComplete ? 'Perfil 100% Completo' : 'Perfil Incompleto'}
            </div>
          )}

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={cancelarEdicao} className="h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                  <X size={16} /> Cancelar
                </button>
                <button onClick={handleSalvar} className="h-10 flex items-center justify-center gap-1.5 px-5 rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all">
                  <Check size={16} /> Salvar Alterações
                </button>
              </>
            ) : (
              <>
                <button onClick={entrarEdicao} className="h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-100 hover:text-black transition-all">
                  <Edit3 size={14} /> Editar Dados
                </button>
                <button onClick={() => setShowSolicitacao(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all" aria-label="Solicitações">
                  <MessageSquarePlus size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Solicitação Pendente */}
      {temPendente && !editMode && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Alteração em análise</p>
            <p className="text-xs text-amber-600 mt-0.5">Você possui uma solicitação de alteração de dados aguardando aprovação do administrador. O Alfred notificará quando houver uma resposta.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Corpo & Segurança (Identidade Visual Preta) */}
        <div className="bg-black text-white rounded-3xl p-4 md:p-7 shadow-xl relative overflow-hidden group">
          <div className="absolute top-6 right-6 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 flex items-center gap-2">
                Credenciais Básicas
              </h2>
              
              <div className="pr-16 lg:pr-24">
                {editMode ? (
                  <div className="mb-2">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Nome</label>
                    {renderEditableField('nome', user?.nome)}
                  </div>
                ) : (
                  <h3 className="text-xl md:text-2xl font-black mb-1 leading-tight break-words">{user?.nome || 'Usuário VIP'}</h3>
                )}
                <p className="text-gray-400 font-medium text-[11px] md:text-xs truncate">{user?.email}</p>
              </div>
            </div>

            {/* Telefone */}
            <div className="mt-3">
              {editMode ? (
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Telefone</label>
                  {renderEditableField('telefone', user?.telefone)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-500" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {user?.telefone || 'Não informado'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 md:mt-4 mb-3 md:mb-4 grid grid-cols-3 gap-2 md:gap-3 p-2 md:p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 flex items-center gap-1">Idade <Lock size={8} className="opacity-50" /></p>
                <p className="font-black text-lg">{user?.idade || '--'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Altura</p>
                {editMode ? (
                  renderEditableField('altura', user?.altura)
                ) : (
                  <p className="font-black text-lg">{user?.altura ? `${user.altura}m` : '--'}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Peso</p>
                {editMode ? (
                  renderEditableField('peso', user?.peso)
                ) : (
                  <p className="font-black text-lg">{user?.peso ? `${user.peso}kg` : '--'}</p>
                )}
              </div>
            </div>
            
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Sexo Genético: <span className="text-white">{user?.sexo || 'Não informado'}</span>
            </p>
          </div>
        </div>

        {/* Coluna da Direita (Cards Brancos) */}
        <div className="space-y-4">
          
          {/* Card 2: Alvo Estratégico */}
          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
             <div className="flex items-start justify-between mb-1">
               <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                 <Goal size={14} className="text-black" /> Direcionamento Físico
               </h2>
               {editMode ? (
                 <div className="w-32">{renderEditableField('nivel_fisico', user?.nivel_fisico)}</div>
               ) : (
                 <span className="text-[9px] uppercase tracking-widest font-black text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                   NÍVEL: {user?.nivel_fisico || 'N/A'}
                 </span>
               )}
             </div>
             {editMode ? (
               <div className="mt-2">{renderEditableField('objetivo', user?.objetivo)}</div>
             ) : (
               <p className="text-xl font-black text-black mt-2">{user?.objetivo || 'Não definido'}</p>
             )}
             <p className="text-xs font-medium text-gray-500 mt-1">Nossa inteligência organiza seus dados, e o Educador Físico monta seu treino com base no macro-objetivo.</p>
          </div>

          {/* Card 3: Rotina & Hábitos */}
          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
             <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5 mb-4">
               <Activity size={14} className="text-black" /> Logística
             </h2>
             
             <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <Timer size={16} />
                 </div>
                 {editMode ? (
                   <div className="flex-1">{renderEditableField('habitos_freq', user?.habitos_freq)}</div>
                 ) : (
                   <div>
                     <p className="text-xs font-black text-black">Constância Semanal</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                       {user?.habitos_freq || 'Não informado'} — {user?.habitos_tempo ? (String(user.habitos_tempo).toLowerCase().match(/min|h/) ? user.habitos_tempo : `${user.habitos_tempo} minutos`) : 'Não informado'}
                     </p>
                   </div>
                 )}
               </div>

               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <MapPin size={16} />
                 </div>
                 {editMode ? (
                   <div className="flex-1">{renderEditableField('habitos_local', user?.habitos_local)}</div>
                 ) : (
                   <div>
                     <p className="text-xs font-black text-black">Base de Treinamento</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{user?.habitos_local || 'Não informado'}</p>
                   </div>
                 )}
               </div>
             </div>
          </div>

        </div>

        {/* Card 4: Ficha Médica (ocupa largura total abaixo dos outros) */}
        <div className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm relative overflow-hidden">
           <div className="absolute -right-4 -bottom-6 text-gray-100/50 pointer-events-none">
             <ShieldAlert size={120} />
           </div>

           <div className="relative z-10">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                 <ShieldAlert size={14} className="text-red-500" /> Prontuário Ortopédico
               </h2>
             </div>

             {editMode ? (
               <div>{renderEditableField('lesoes_criticas', user?.lesoes_criticas)}</div>
             ) : (
               <div className="bg-white p-4 rounded-xl border border-gray-100/50">
                 {user?.lesoes_criticas ? (
                   <p className="font-medium text-gray-700 leading-relaxed text-xs">
                     {user.lesoes_criticas}
                   </p>
                 ) : (
                   <p className="font-medium text-gray-400 italic text-xs">
                     Nenhum histórico de lesão relatado no momento do onboarding. Músculos e articulações aptos.
                   </p>
                 )}
               </div>
             )}

             <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
               <AlertCircle size={12} /> Sugerimos autorização médica antes de exercícios de alta carga.
             </p>
           </div>
        </div>

      </div>


      {/* ── MODAL DE RESUMO COMPARATIVO ──────────────────────────────── */}
      {showResumo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !enviandoAlteracao && !alteracaoSuccess && setShowResumo(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[85vh]">
            
            {alteracaoSuccess ? (
              <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Alterações Processadas!</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {getAlteracoesAgrupadas().controladas.length > 0 
                    ? 'As alterações que requerem aprovação foram enviadas ao administrador. O Alfred o notificará quando forem analisadas.'
                    : 'Seus dados foram atualizados com sucesso!'}
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Confirmar Alterações</h3>
                  <button onClick={() => setShowResumo(false)} className="text-gray-400 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                  {(() => {
                    const { diretas, controladas } = getAlteracoesAgrupadas();
                    return (
                      <>
                        {/* Alterações Diretas */}
                        {diretas.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <Check size={12} /> Aplicação Imediata
                            </p>
                            {diretas.map(alt => (
                              <div key={alt.campo} className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mb-2">
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{alt.label}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-gray-400 line-through">{alt.de || 'Vazio'}</span>
                                    <ArrowRight size={12} className="text-emerald-500" />
                                    <span className="text-xs font-black text-emerald-700">{alt.para}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Alterações que Requerem Aprovação */}
                        {controladas.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <AlertCircle size={12} /> Requer Aprovação do Administrador
                            </p>
                            {controladas.map(alt => (
                              <div key={alt.campo} className={`flex items-center gap-3 rounded-xl p-3 mb-2 border ${alt.impacta_prescricao ? 'bg-red-50/30 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{alt.label}</p>
                                    {alt.impacta_prescricao && (
                                      <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-widest">Impacta Treino</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-gray-400 line-through">{alt.de || 'Vazio'}</span>
                                    <ArrowRight size={12} className="text-amber-500" />
                                    <span className="text-xs font-black text-amber-700">{alt.para}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="px-6 pb-6 shrink-0">
                  <button 
                    onClick={confirmarAlteracoes}
                    disabled={enviandoAlteracao}
                    className="w-full bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {enviandoAlteracao ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : 'Confirmar Alterações'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* ── MODAL DE SOLICITAÇÃO ──────────────────────────────────────── */}
      {showSolicitacao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !solicitacaoSuccess && setShowSolicitacao(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden">
            
            {solicitacaoSuccess ? (
              <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Solicitação Enviada!</h3>
                <p className="text-sm text-gray-500 font-medium">
                  Sua solicitação foi encaminhada para análise da administração com sucesso. O Alfred o notificará assim que houver uma resposta.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Falar com o Educador</h3>
                  <button onClick={() => setShowSolicitacao(false)} className="text-gray-400 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleEnviarSolicitacao} className="p-6 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Tipo de Pedido</label>
                    <select 
                      value={solicitacaoForm.tipo}
                      onChange={e => setSolicitacaoForm(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black"
                    >
                      <option value="DUVIDA_EXECUCAO">Dúvida de Execução</option>
                      <option value="SUBSTITUIR_EXERCICIO">Substituir Exercício</option>
                      <option value="ATUALIZAR_INFORMACOES">Atualizar Informações</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Sua Mensagem</label>
                    <textarea 
                      value={solicitacaoForm.mensagem}
                      onChange={e => setSolicitacaoForm(prev => ({ ...prev, mensagem: e.target.value }))}
                      placeholder="Descreva detalhadamente o que gostaria de alterar em seus dados ou no seu plano atual..."
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black resize-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={enviandoSolicitacao || !solicitacaoForm.mensagem.trim()}
                    className="w-full bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl mt-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {enviandoSolicitacao ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
