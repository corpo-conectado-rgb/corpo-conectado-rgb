import React from 'react';

export default function Welcome() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden -m-6 lg:-m-8 rounded-2xl">
      
      {/* Background decoration (subtle glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] bg-gradient-to-tr from-amber-50 to-blue-50 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
      
      {/* Ícone — Centro absoluto da área de conteúdo */}
      <img 
        src="/CC_Icone.png" 
        alt="Corpo Conectado Logo" 
        className="relative z-10 max-h-[45vh] max-w-[70%] w-auto object-contain animate-fade-up drop-shadow-xl" 
        style={{ animationDuration: '0.8s' }}
      />

      {/* Bloco de Assinatura — Ancorado na parte inferior */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-10 animate-fade-up" style={{ animationDuration: '1s' }}>
        
        {/* Nome da marca */}
        <h1 className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase text-[#C4973B]">
          Corpo Conectado
        </h1>

        {/* Separador decorativo */}
        <div className="w-10 h-px bg-[#C4973B]/30"></div>

        {/* Subtítulo */}
        <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-[0.25em] text-center">
          Sistema de Gestão Desportiva e Prescrição
        </p>

      </div>
    </div>
  );
}
