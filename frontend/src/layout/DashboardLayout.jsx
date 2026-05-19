import React from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[var(--color-bg-base)] font-sans text-gray-800 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="bi-canvas max-w-7xl mx-auto h-full bg-white flex flex-col p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
