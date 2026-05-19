import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function SemPermissao() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in text-center">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} className="text-red-500" />
      </div>
      
      <h1 className="text-3xl font-black text-gray-900 mb-2">Acesso Restrito</h1>
      <p className="text-gray-500 font-medium max-w-md mb-8 leading-relaxed">
        Você não possui as credenciais administrativas necessárias para visualizar este estúdio de controle.
      </p>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-black hover:bg-gray-800 transition shadow-lg"
        >
          <Home size={16} /> Painel Inicial
        </button>
      </div>
    </div>
  );
}
