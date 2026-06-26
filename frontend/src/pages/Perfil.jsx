import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Goal, Activity, Timer, MapPin, ShieldAlert, Settings2, X, Check, MessageSquarePlus, Phone, ArrowRight, Lock, Loader2, User as UserIcon, Scale, CalendarHeart, ClipboardList, Shield } from 'lucide-react';
import { apiFetch } from '../services/api';

// Definição dos campos editáveis e suas regras
const CAMPOS_CONFIG = {
  nome:          { label: 'Nome Completo',       tipo: 'text',     controlado: true,  impacta: false },
  telefone:      { label: 'Telefone',            tipo: 'tel',      controlado: false, impacta: false, placeholder: '(00) 00000-0000' },
  habitos_local: { label: 'Local de Treino',     tipo: 'select',   controlado: false, impacta: false, opcoes: ['Smart Fit', 'Pratique', 'Contorno', 'Outro'] },
  peso:          { label: 'Peso (kg)',           tipo: 'number',   controlado: true,  impacta: true  },
  altura:        { label: 'Altura (m)',          tipo: 'number',   controlado: true,  impacta: true  },
  objetivo:      { label: 'Objetivo Principal',  tipo: 'select',   controlado: true,  impacta: true, opcoes: ['Emagrecimento', 'Hipertrofia', 'Saúde Geral'] },
  nivel_fisico:  { label: 'Nível Físico',        tipo: 'select',   controlado: true,  impacta: true, opcoes: ['Iniciante', 'Intermediário', 'Avançado'] },
  habitos_freq:  { label: 'Frequência Semanal',  tipo: 'select',   controlado: true,  impacta: true, opcoes: ['1x', '2x', '3x', '4x', '5x', '6x', '7x'] },
  lesoes_criticas: { label: 'Lesões / Restrições (Opcional)', tipo: 'textarea', controlado: true, impacta: true },
};

export default function Perfil() {
  const { user, updateUser, refreshProfile } = useAuth();
  
  // Estados do modal de solicitação legada (mantido por segurança)
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [solicitacaoSuccess, setSolicitacaoSuccess] = useState(false);
  const [solicitacaoForm, setSolicitacaoForm] = useState({ tipo: 'IMPLEMENTACAO', mensagem: '' });
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  // Estados do Drawer Lateral
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState('FORM'); // 'FORM' | 'REVIEW' | 'SUCCESS'
  const [editedFields, setEditedFields] = useState({});
  const [enviandoAlteracao, setEnviandoAlteracao] = useState(false);
  
  // Verificação de pendências
  const [temPendente, setTemPendente] = useState(false);

  useEffect(() => {
    const checkPendente = async () => {
      try {
        // Logica para checar se tem pendente
        // Se houver backend q retorna isso, chamamos aqui.
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
        setSolicitacaoForm({ tipo: 'IMPLEMENTACAO', mensagem: '' });
      }, 4000);
    } catch (err) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  // Funções do Drawer
  const openDrawer = () => {
    setEditedFields({});
    setDrawerStep('FORM');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setDrawerStep('FORM');
      setEditedFields({});
    }, 300); // delay para animar saida
  };

  const handleFieldChange = (campo, valor) => {
    setEditedFields(prev => ({ ...prev, [campo]: valor }));
  };

  const getFieldValue = (campo) => {
    if (editedFields[campo] !== undefined) return editedFields[campo];
    return user?.[campo] || '';
  };

  const temAlteracoes = () => {
    return Object.keys(editedFields).some(campo => {
      const valorOriginal = user?.[campo] || '';
      return String(editedFields[campo]).trim() !== String(valorOriginal).trim();
    });
  };

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

  const handleRevisar = () => {
    if (!temAlteracoes()) {
      closeDrawer();
      return;
    }
    setDrawerStep('REVIEW');
  };

  const confirmarAlteracoes = async () => {
    try {
      setEnviandoAlteracao(true);
      const { diretas, controladas } = getAlteracoesAgrupadas();

      if (diretas.length > 0) {
        const payload = {};
        diretas.forEach(alt => { payload[alt.campo] = alt.para; });
        const updatedUser = await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        updateUser(updatedUser);
      }

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

      setDrawerStep('SUCCESS');
      
      if (diretas.length > 0 && controladas.length === 0) {
        try { await refreshProfile(); } catch {}
      }

    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setEnviandoAlteracao(false);
    }
  };

  // Verifica se todas as informações do perfil estão preenchidas (exceto lesões, que é opcional)
  const isProfileComplete = 
    user?.nome && 
    user?.telefone && 
    user?.idade && 
    user?.sexo && 
    user?.peso && 
    user?.altura && 
    user?.objetivo && 
    user?.nivel_fisico && 
    user?.habitos_freq && 
    user?.habitos_local;

  return (
    <div className="max-w-4xl mx-auto pb-4 animate-fade-in relative">
      
      {/* ===== VITRINE PRINCIPAL (Leitura Limpa) ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meus Dados</h1>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={openDrawer}
              className="h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl bg-transparent text-gray-500 hover:text-black hover:bg-gray-50 transition-all font-black text-[11px] uppercase tracking-widest"
            >
              <Settings2 size={16} /> Editar
            </button>
            <button 
              onClick={() => setShowSolicitacao(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
            >
              <MessageSquarePlus size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className={`flex items-center justify-center flex-1 md:flex-initial gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 ${isProfileComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} rounded-xl md:rounded-full text-[10px] md:text-sm font-bold border ${isProfileComplete ? 'border-green-200' : 'border-amber-200'}`}>
            {isProfileComplete ? <CheckCircle2 size={14} className="md:w-4 md:h-4" /> : <AlertCircle size={14} className="md:w-4 md:h-4" />}
            {isProfileComplete ? 'Perfil 100% Completo' : 'Perfil Incompleto'}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={openDrawer} className="h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-transparent text-gray-500 hover:text-black hover:bg-gray-50 transition-all font-black text-[11px] uppercase tracking-widest">
              <Settings2 size={14} /> Atualizar Perfil
            </button>
            <button onClick={() => setShowSolicitacao(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all">
              <MessageSquarePlus size={20} />
            </button>
          </div>
        </div>
      </div>

      {temPendente && (
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
                <h3 className="text-xl md:text-2xl font-black mb-1 leading-tight break-words">{user?.nome || 'Usuário VIP'}</h3>
                <p className="text-gray-400 font-medium text-[11px] md:text-xs truncate">{user?.email}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gray-500" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {user?.telefone || 'Telefone não informado'}
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-6 mb-3 md:mb-4 grid grid-cols-3 gap-2 md:gap-3 p-2 md:p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 flex items-center gap-1">Idade <Lock size={8} className="opacity-50" /></p>
                <p className="font-black text-lg">{user?.idade || '--'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Altura</p>
                <p className="font-black text-lg">{user?.altura ? `${user.altura}m` : '--'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Peso</p>
                <p className="font-black text-lg">{user?.peso ? `${user.peso}kg` : '--'}</p>
              </div>
            </div>
            
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Sexo Genético: <span className="text-white">{user?.sexo || 'Não informado'}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          
          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
             <div className="flex items-start justify-between mb-1">
               <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                 <Goal size={14} className="text-black" /> Direcionamento Físico
               </h2>
               <span className="text-[9px] uppercase tracking-widest font-black text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                 NÍVEL: {user?.nivel_fisico || 'N/A'}
               </span>
             </div>
             <p className="text-xl font-black text-black mt-2">{user?.objetivo || 'Não definido'}</p>
             <p className="text-xs font-medium text-gray-500 mt-1">Nossa inteligência organiza seus dados, e o Educador Físico monta seu treino com base no macro-objetivo.</p>
          </div>

          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
             <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5 mb-4">
               <Activity size={14} className="text-black" /> Logística
             </h2>
             
             <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <Timer size={16} />
                 </div>
                 <div>
                   <p className="text-xs font-black text-black">Constância Semanal</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                     {user?.habitos_freq || 'Não informado'} — {user?.habitos_tempo ? (String(user.habitos_tempo).toLowerCase().match(/min|h/) ? user.habitos_tempo : `${user.habitos_tempo} minutos`) : 'Não informado'}
                   </p>
                 </div>
               </div>

               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <MapPin size={16} />
                 </div>
                 <div>
                   <p className="text-xs font-black text-black">Base de Treinamento</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{user?.habitos_local || 'Não informado'}</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

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

             <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
               <AlertCircle size={12} /> Sugerimos autorização médica antes de exercícios de alta carga.
             </p>
           </div>
        </div>

      </div>

      {/* ===== DRAWER LATERAL DE EDIÇÃO ===== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={closeDrawer}
          />
          
          {/* Drawer Container */}
          <div className={`relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} md:rounded-l-3xl`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10 md:rounded-tl-3xl">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  {drawerStep === 'FORM' ? 'Atualização Cadastral' : drawerStep === 'REVIEW' ? 'Revisar Alterações' : 'Tudo Certo!'}
                </h3>
                {drawerStep === 'FORM' && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Meus Dados</p>}
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body - FORM STEP */}
            {drawerStep === 'FORM' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                
                {/* Section: Contato */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-purple-500" /> Informações de Contato
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Nome Completo</label>
                      <input type="text" value={getFieldValue('nome')} onChange={e => handleFieldChange('nome', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Telefone</label>
                      <input type="tel" placeholder="(00) 00000-0000" value={getFieldValue('telefone')} onChange={e => handleFieldChange('telefone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                    </div>
                    <div className="opacity-60">
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 flex items-center gap-1 uppercase tracking-wide">Email <Lock size={10} /></label>
                      <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Biometria */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                    <Scale size={14} className="text-blue-500" /> Biometria Corporal
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Peso (kg)</label>
                      <input type="number" step="0.1" value={getFieldValue('peso')} onChange={e => handleFieldChange('peso', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Altura (m)</label>
                      <input type="number" step="0.01" value={getFieldValue('altura')} onChange={e => handleFieldChange('altura', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 opacity-60">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 flex items-center gap-1 uppercase tracking-wide">Idade <Lock size={10}/></label>
                      <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed">{user?.idade}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 mb-1.5 flex items-center gap-1 uppercase tracking-wide">Sexo <Lock size={10}/></label>
                      <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed">{user?.sexo}</div>
                    </div>
                  </div>
                </div>

                {/* Section: Treinamento */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-emerald-500" /> Treinamento e Rotina
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Objetivo</label>
                        <select value={getFieldValue('objetivo')} onChange={e => handleFieldChange('objetivo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 outline-none">
                          <option value="">Selecione</option>
                          {CAMPOS_CONFIG.objetivo.opcoes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Nível</label>
                        <select value={getFieldValue('nivel_fisico')} onChange={e => handleFieldChange('nivel_fisico', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 outline-none">
                          <option value="">Selecione</option>
                          {CAMPOS_CONFIG.nivel_fisico.opcoes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Frequência</label>
                        <select value={getFieldValue('habitos_freq')} onChange={e => handleFieldChange('habitos_freq', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 outline-none">
                          <option value="">Selecione</option>
                          {CAMPOS_CONFIG.habitos_freq.opcoes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Local Base</label>
                        <select value={getFieldValue('habitos_local')} onChange={e => handleFieldChange('habitos_local', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 outline-none">
                          <option value="">Selecione</option>
                          {CAMPOS_CONFIG.habitos_local.opcoes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Lesoes */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-1.5">
                    <Shield size={14} className="text-red-500" /> Prontuário Médico
                  </h4>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wide">Lesões ou Restrições Ortópedicas</label>
                    <textarea 
                      value={getFieldValue('lesoes_criticas')} 
                      onChange={e => handleFieldChange('lesoes_criticas', e.target.value)} 
                      rows={3}
                      placeholder="Descreva caso tenha alguma dor, lesão antiga ou recomendação médica..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black resize-none"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Drawer Body - REVIEW STEP */}
            {drawerStep === 'REVIEW' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
                {(() => {
                  const { diretas, controladas } = getAlteracoesAgrupadas();
                  return (
                    <>
                      {diretas.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-emerald-50 w-max px-2 py-1 rounded-md">
                            <Check size={12} /> Aplicação Imediata
                          </p>
                          {diretas.map(alt => (
                            <div key={alt.campo} className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-3">
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{alt.label}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-400 line-through truncate max-w-[40%]">{alt.de || 'Vazio'}</span>
                                  <ArrowRight size={14} className="text-emerald-500 shrink-0" />
                                  <span className="text-sm font-black text-emerald-700 truncate">{alt.para}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {controladas.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5 bg-amber-50 w-max px-2 py-1 rounded-md">
                            <AlertCircle size={12} /> Requer Aprovação
                          </p>
                          {controladas.map(alt => (
                            <div key={alt.campo} className={`flex items-center gap-3 rounded-xl p-4 mb-3 shadow-sm border ${alt.impacta_prescricao ? 'bg-red-50/20 border-red-100' : 'bg-white border-gray-100'}`}>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{alt.label}</p>
                                  {alt.impacta_prescricao && (
                                    <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-widest">Impacta Treino</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-400 line-through truncate max-w-[40%]">{alt.de || 'Vazio'}</span>
                                  <ArrowRight size={14} className="text-amber-500 shrink-0" />
                                  <span className="text-sm font-black text-amber-700 truncate">{alt.para}</span>
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
            )}

            {/* Drawer Body - SUCCESS STEP */}
            {drawerStep === 'SUCCESS' && (
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                  <Check size={40} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Alterações Salvas!</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {getAlteracoesAgrupadas().controladas.length > 0 
                    ? 'As alterações que requerem aprovação foram enviadas ao administrador. O Alfred o notificará.'
                    : 'Seus dados foram atualizados com sucesso!'}
                </p>
                <button onClick={closeDrawer} className="mt-8 px-6 py-3 bg-gray-100 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-colors">
                  Voltar ao Perfil
                </button>
              </div>
            )}

            {/* Drawer Footer (Actions) */}
            {drawerStep !== 'SUCCESS' && (
              <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                {drawerStep === 'FORM' ? (
                  <button 
                    onClick={handleRevisar}
                    className="w-full bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={!temAlteracoes()}
                  >
                    Revisar Alterações <ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setDrawerStep('FORM')}
                      disabled={enviandoAlteracao}
                      className="flex-1 bg-gray-100 text-gray-600 font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={confirmarAlteracoes}
                      disabled={enviandoAlteracao}
                      className="flex-[2] bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {enviandoAlteracao ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Confirmar e Salvar'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}


      {/* Modal de Solicitação Antiga (Mantida por segurança) */}
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
                  Sua solicitação foi encaminhada. O Alfred o notificará assim que houver uma resposta.
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
                      <option value="IMPLEMENTACAO">Implementação</option>
                      <option value="FINANCEIRO">Financeiro</option>
                      <option value="FICHA">Ficha</option>
                      <option value="EXECUCAO">Execução</option>
                      <option value="APLICATIVO">Aplicativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Sua Mensagem</label>
                    <textarea 
                      value={solicitacaoForm.mensagem}
                      onChange={e => setSolicitacaoForm(prev => ({ ...prev, mensagem: e.target.value }))}
                      placeholder="Descreva o que deseja mudar..."
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
