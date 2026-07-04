import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import FloatingAlfred from '../components/FloatingAlfred';
import { apiFetch } from '../services/api';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensalidadeAtrasada, setMensalidadeAtrasada] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    apiFetch('/financeiro/minha-mensalidade')
      .then(res => {
        if (res && res.status === 'ATRASADA') {
          if (res.dias_atraso > 5) {
            setBloqueado(true);
            if (location.pathname !== '/financeiro') {
              navigate('/financeiro', { replace: true });
            }
          } else {
            setMensalidadeAtrasada(true);
          }
        }
      })
      .catch(() => {});
  }, [location.pathname, navigate]);

  return (
    <div className="flex h-screen bg-[var(--color-bg-base)] font-sans text-gray-800 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 h-full overflow-hidden p-1.5 pt-14 md:p-4 md:pt-16 lg:p-5 lg:pt-5">
        {/* Hamburger button – mobile only */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="lg:hidden fixed top-2 left-2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md text-gray-700 hover:bg-white transition"
        >
          <Menu size={22} />
        </button>

        {/* Banner de alerta (quando <= 5 dias de atraso) */}
        {mensalidadeAtrasada && !bloqueado && location.pathname !== '/financeiro' && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm animate-fade-in relative z-20 overflow-hidden group cursor-pointer" onClick={() => navigate('/financeiro')}>
             <div className="flex items-center gap-3 relative z-10">
               <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                 <AlertCircle size={16} className="text-amber-600" />
               </div>
               <div>
                 <p className="text-sm font-black text-gray-900 tracking-tight">Pagamento Atrasado</p>
                 <p className="text-xs font-medium text-gray-600">Sua mensalidade está vencida. Evite o bloqueio do seu acesso.</p>
               </div>
             </div>
             <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 group-hover:translate-x-1 transition-transform relative z-10">
               Regularizar <ArrowRight size={14} strokeWidth={3} />
             </div>
             <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-amber-100/50 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Banner de bloqueio rigoroso (quando > 5 dias de atraso e já está na tela Financeiro) */}
        {bloqueado && location.pathname === '/financeiro' && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm animate-fade-in relative z-20">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                 <Lock size={16} className="text-red-600" />
               </div>
               <div>
                 <p className="text-sm font-black text-red-900 tracking-tight">Acesso Bloqueado</p>
                 <p className="text-xs font-medium text-red-700">Seu acesso está restrito devido à inadimplência. Regularize agora para liberar o aplicativo.</p>
               </div>
             </div>
          </div>
        )}

        {/* Se bloqueado e não estiver na tela financeiro, nem mostra o Outlet. */}
        {(!bloqueado || location.pathname === '/financeiro') && (
          <div className="bi-canvas relative max-w-7xl mx-auto h-full bg-white flex flex-col p-3 md:p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        )}
      </main>

      {/* Assistente Virtual Flutuante */}
      <FloatingAlfred />
    </div>
  );
}
