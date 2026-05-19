import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Goal, Activity, Timer, MapPin, ShieldAlert, Edit3 } from 'lucide-react';

export default function Perfil() {
  const { user } = useAuth();

  // Verifica se todos os principais campos da anamnese estão preenchidos para definir o status
  const isProfileComplete = user?.idade && user?.peso && user?.altura && user?.objetivo;

  return (
    <div className="max-w-4xl mx-auto pb-4 animate-fade-in">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Dados</h1>
          <p className="text-gray-500 font-medium mt-0.5 text-sm">Central de informações e histórico biológico.</p>
        </div>
        
        {/* Status Badge Dinâmico */}
        <div className={`flex items-center gap-2 px-4 py-2 ${isProfileComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} rounded-full text-sm font-bold border ${isProfileComplete ? 'border-green-200' : 'border-amber-200'}`}>
          {isProfileComplete ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {isProfileComplete ? 'Perfil 100% Completo' : 'Perfil Incompleto'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Corpo & Segurança (Identidade Visual Preta) */}
        <div className="bg-black text-white rounded-3xl p-6 md:p-7 shadow-xl relative overflow-hidden group">
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

            <div className="mt-6 mb-4 grid grid-cols-3 gap-3 p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5">
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
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
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
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
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
        <div className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
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

      {/* Botão de Edição Reservado para o Futuro */}
      <div className="mt-6 text-center">
        <button className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                onClick={() => alert("Para alterar suas métricas base, procure seu treinador via suporte.")}>
           <Edit3 size={12} /> Solicitar Ajuste Físico
        </button>
      </div>

    </div>
  );
}
