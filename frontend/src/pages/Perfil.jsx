import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Goal, Activity, Timer, MapPin, ShieldAlert, Edit3, X, Check, MessageSquarePlus } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function Perfil() {
  const { user } = useAuth();
  
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [solicitacaoSuccess, setSolicitacaoSuccess] = useState(false);
  const [solicitacaoForm, setSolicitacaoForm] = useState({ tipo: 'REAVALIACAO', mensagem: '' });
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

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
        setSolicitacaoForm({ tipo: 'REAVALIACAO', mensagem: '' });
      }, 4000);
    } catch (err) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  // Verifica se todos os principais campos da anamnese estão preenchidos para definir o status
  const isProfileComplete = user?.idade && user?.peso && user?.altura && user?.objetivo;

  return (
    <div className="max-w-4xl mx-auto pb-4 animate-fade-in">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meus Dados</h1>
            <p className="text-gray-500 font-medium mt-0.5 text-[11px] md:text-sm">Central de informações e histórico biológico.</p>
          </div>
          
          {/* Mobile Solicitações Button */}
          <div className="md:hidden relative group">
            <button 
              onClick={() => setShowSolicitacao(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
              aria-label="Solicitações"
            >
              <MessageSquarePlus size={20} />
            </button>
            <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                Solicitações
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Badge Dinâmico */}
          <div className={`flex items-center justify-center flex-1 md:flex-initial gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 ${isProfileComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} rounded-xl md:rounded-full text-[10px] md:text-sm font-bold border ${isProfileComplete ? 'border-green-200' : 'border-amber-200'}`}>
            {isProfileComplete ? <CheckCircle2 size={14} className="md:w-4 md:h-4" /> : <AlertCircle size={14} className="md:w-4 md:h-4" />}
            {isProfileComplete ? 'Perfil 100% Completo' : 'Perfil Incompleto'}
          </div>

          {/* Desktop Solicitações Button */}
          <div className="hidden md:block relative group">
            <button 
              onClick={() => setShowSolicitacao(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
              aria-label="Solicitações"
            >
              <MessageSquarePlus size={20} />
            </button>
            <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                Solicitações
              </div>
            </div>
          </div>
        </div>
      </div>

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

            <div className="mt-4 md:mt-6 mb-3 md:mb-4 grid grid-cols-3 gap-2 md:gap-3 p-2 md:p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Idade</p>
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

        {/* Coluna da Direita (Cards Brancos) */}
        <div className="space-y-4">
          
          {/* Card 2: Alvo Estratégico */}
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
             <p className="text-xs font-medium text-gray-500 mt-1">Nossa inteligência moldará seus treinos com base nesse macro-objetivo.</p>
          </div>

          {/* Card 3: Rotina & Hábitos */}
          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
             <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5 mb-4">
               <Activity size={14} className="text-black" /> Logística
             </h2>
             
             <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                    <Timer size={16} />
                 </div>
                 <div>
                   <p className="text-xs font-black text-black">Constância Semanal</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{user?.habitos_freq || 'Não informado'} — {user?.habitos_tempo || '0h'}/dia</p>
                 </div>
               </div>

               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
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
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Falar com Treinador</h3>
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
                      <option value="REAVALIACAO">Solicitar Reavaliação (Métricas/Novo Ciclo)</option>
                      <option value="AJUSTE_TREINO">Dúvida ou Troca de Exercício</option>
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
