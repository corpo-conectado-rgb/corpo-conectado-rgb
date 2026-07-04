import React, { useState, useEffect } from 'react';
import { Wallet, Search, TrendingUp, TrendingDown, Users, AlertCircle, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

export default function AdminFinanceiro() {
  const [dashboard, setDashboard] = useState({ receitaMes: 0, receitaAno: 0, totalAberto: 0, qtdInadimplentes: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashData = await apiFetch('/financeiro/admin/dashboard');
      setDashboard(dashData);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao carregar dashboard financeiro.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Buscando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 flex-shrink-0 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Wallet className="text-gray-900" size={32} strokeWidth={2.5} /> Gestão Financeira
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Visão geral do faturamento e alunos.</p>
          </div>
          <button className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 shadow-md self-start md:self-auto">
            + Nova Cobrança
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 overflow-y-auto bg-gray-50/50">
        <div className="max-w-6xl mx-auto py-6 space-y-6">
          
          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Receita Mensal</p>
              <p className="text-2xl font-black text-gray-900">R$ {dashboard.receitaMes.toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center gap-1 text-emerald-600 mt-2">
                <TrendingUp size={12} /> <span className="text-xs font-bold">No mês atual</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Receita Anual</p>
              <p className="text-2xl font-black text-gray-900">R$ {dashboard.receitaAno.toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center gap-1 text-emerald-600 mt-2">
                <TrendingUp size={12} /> <span className="text-xs font-bold">Acumulado {new Date().getFullYear()}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Em Aberto</p>
              <p className="text-2xl font-black text-gray-900">R$ {dashboard.totalAberto.toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center gap-1 text-amber-600 mt-2">
                <Clock size={12} /> <span className="text-xs font-bold">Pendente/Atrasado</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Inadimplentes</p>
              <p className="text-2xl font-black text-gray-900">{dashboard.qtdInadimplentes}</p>
              <div className="flex items-center gap-1 text-red-600 mt-2">
                <AlertCircle size={12} /> <span className="text-xs font-bold">Alunos com atraso</span>
              </div>
            </div>
          </section>

          {/* LISTAGEM PLACEHOLDER */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-gray-400" />
             </div>
             <h3 className="text-lg font-black text-gray-900">Listagem de Alunos</h3>
             <p className="text-sm text-gray-500 mt-2 max-w-sm">
               A tabela detalhada com o status financeiro de cada aluno será implementada na próxima fase.
             </p>
          </section>

        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />}
    </div>
  );
}
