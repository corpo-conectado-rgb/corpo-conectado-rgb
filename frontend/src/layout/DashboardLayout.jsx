import React from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[var(--color-bg-base)] font-sans text-gray-800 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden p-3 md:p-4 lg:p-5">
        <div className="bi-canvas max-w-7xl mx-auto h-full bg-white flex flex-col p-4 md:p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
