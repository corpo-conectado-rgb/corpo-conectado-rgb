import React from 'react';

export default function Welcome() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-2xl">
      
      {/* Background decoration (subtle glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] bg-gradient-to-tr from-amber-50 to-blue-50 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
      
      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Ícone */}
        <img 
          src="/Icone_Corpo_Conectado_Premium.png" 
          alt="Corpo Conectado Logo" 
          className="max-h-[40vh] max-w-[65%] w-auto object-contain animate-fade-up drop-shadow-xl" 
          style={{ animationDuration: '0.8s' }}
        />

        {/* Bloco de Assinatura */}
        <div className="flex flex-col items-center gap-2 animate-fade-up" style={{ animationDuration: '1s' }}>
          <h1 className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase text-[#C4973B]">
            Corpo Conectado
          </h1>
          <div className="w-10 h-px bg-[#C4973B]/30"></div>
          <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-[0.25em] text-center">
            Sistema de Gestão Desportiva e Prescrição
          </p>
        </div>
      </div>
    </div>
  );
}
