import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Dumbbell, Activity, User, ArrowLeft, Home, Bell } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Início', icon: Home, path: '/' },
    { name: 'Dashboard Central', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Meu Treino', icon: Dumbbell, path: '/treinos' },
    { name: 'Meus Dados', icon: User, path: '/perfil' },
  ];

  const adminMenu = user?.role === 'admin' ? [
    { name: 'Gestão de Fichas', icon: FileText, path: '/admin/alunos' },
    { name: 'Solicitações', icon: Bell, path: '/admin/solicitacoes' }
  ] : [];

  return (
    <>
      {/* Dark overlay – mobile only */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'w-[280px] bg-[var(--color-noir-navy)] h-[100dvh] flex flex-col z-50 overflow-hidden shrink-0',
          // Mobile: fixed overlay, slides in/out
          'fixed top-0 left-0 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static in flow, always visible
          'lg:static lg:translate-x-0'
        )}
      >
        {/* App title */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <span className="text-white font-black text-lg tracking-tight">Corpo Conectado</span>
        </div>

        <div className="px-8 py-1 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4 mb-2 shrink-0">
          Navegação Principal
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 mt-0 overflow-y-auto pb-4 scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => clsx(
                  isActive ? 'sidebar-item-active' : 'sidebar-item'
                )}
              >
                <Icon size={18} />
                <span className="tracking-wide">{item.name}</span>
              </NavLink>
            );
          })}

          {adminMenu.length > 0 && (
            <>
              <div className="px-8 py-1 text-[10px] font-black text-blue-500 uppercase tracking-widest mt-6 mb-1 border-t border-white/5 pt-4 shrink-0">
                Administrador
              </div>
              {adminMenu.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => clsx(
                      isActive ? 'sidebar-item-active' : 'sidebar-item text-gray-400 hover:text-blue-300'
                    )}
                  >
                    <Icon size={18} />
                    <span className="tracking-wide font-black">{item.name}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer / Desconectar */}
        <div
          onClick={() => { onClose(); handleLogout(); }}
          className="p-6 pb-8 shrink-0 mt-auto cursor-pointer hover:text-white text-gray-500 transition flex items-center gap-3 border-t border-[rgba(255,255,255,0.02)] active:scale-95 active:bg-white/5"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Desconectar</span>
        </div>
      </aside>
    </>
  );
}
