import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Dumbbell, Activity, User, ArrowLeft, Home } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
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
    { name: 'Gestão de Fichas', icon: FileText, path: '/admin/alunos' }
  ] : [];

  return (
    <aside className="w-[280px] bg-[var(--color-noir-navy)] h-screen flex flex-col z-50 overflow-hidden">
      <div className="px-8 py-1 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-12 mb-2">
        Navegação Principal
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 mt-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              isActive ? 'sidebar-item-active' : 'sidebar-item'
            )}
          >
            <Icon size={18} />
            <span className="tracking-wide">{item.name}</span>
          </NavLink>
        )})}

        {adminMenu.length > 0 && (
          <>
            <div className="px-8 py-1 text-[10px] font-black text-blue-500 uppercase tracking-widest mt-6 mb-1 border-t border-white/5 pt-4">
              Administrador
            </div>
            {adminMenu.map((item) => {
              const Icon = item.icon;
              return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  isActive ? 'sidebar-item-active' : 'sidebar-item text-gray-400 hover:text-blue-300'
                )}
              >
                <Icon size={18} />
                <span className="tracking-wide font-black">{item.name}</span>
              </NavLink>
            )})}
          </>
        )}
      </nav>

      {/* Footer / Voltar */}
      <div onClick={handleLogout} className="p-6 mt-auto cursor-pointer hover:text-white text-gray-500 transition flex items-center gap-3 border-t border-[rgba(255,255,255,0.02)]">
         <ArrowLeft size={18} />
         <span className="font-bold text-sm">Desconectar</span>
      </div>
    </aside>
  );
}
