import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--color-bg-base)] font-sans text-gray-800 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 h-full overflow-hidden p-3 pt-16 md:p-4 md:pt-16 lg:p-5 lg:pt-5">
        {/* Hamburger button – mobile only */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="lg:hidden fixed top-3 left-3 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md text-gray-700 hover:bg-white transition"
        >
          <Menu size={22} />
        </button>

        <div className="bi-canvas max-w-7xl mx-auto h-full bg-white flex flex-col p-4 md:p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
