import React, { useState, useEffect } from 'react';
import { Wallet, Search, TrendingUp, TrendingDown, Users, AlertCircle, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

export default function AdminFinanceiro() {
  const [dashboard, setDashboard] = useState({ receitaMes: 0, receitaAno: 0, totalAberto: 0, qtdInadimplentes: 0 });
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [novaCobranca, setNovaCobranca] = useState({
    user_id: '',
    valor: 19.90, // default requested by user
    data_vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0], // next month, day 10
    referencia: `${new Date().getMonth() + 2}/${new Date().getFullYear()}`.padStart(7, '0') // simple string format mm/yyyy
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, alunosData] = await Promise.all([
        apiFetch('/financeiro/admin/dashboard'),
        apiFetch('/financeiro/admin/alunos')
      ]);
      setDashboard(dashData);
      setAlunos(alunosData || []);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao carregar dashboard financeiro.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNovaCobranca = async (e) => {
    e.preventDefault();
    if (!novaCobranca.user_id) {
      setToast({ show: true, message: 'Selecione um aluno.', type: 'warning' });
      return;
    }
    try {
      setGerando(true);
      await apiFetch('/financeiro/admin/cobranca', {
        method: 'POST',
        body: JSON.stringify({
          user_id: novaCobranca.user_id,
          valor: Number(novaCobranca.valor),
          data_vencimento: novaCobranca.data_vencimento,
          referencia: novaCobranca.referencia
        })
      });
      setToast({ show: true, message: 'Cobrança gerada com sucesso!', type: 'success' });
      setShowModal(false);
      loadData(); // refresh data
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Falha ao gerar cobrança.', type: 'error' });
    } finally {
      setGerando(false);
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
          <button 
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 shadow-md self-start md:self-auto"
          >
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

          {/* LISTAGEM */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Listagem de Alunos</h2>
             </div>
             
             {alunos.length === 0 ? (
               <div className="p-8 text-center text-gray-500">Nenhum aluno encontrado.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                     <tr>
                       <th className="px-6 py-4">Aluno</th>
                       <th className="px-6 py-4">Status Mensalidade</th>
                       <th className="px-6 py-4 hidden md:table-cell">Último Valor</th>
                       <th className="px-6 py-4 hidden md:table-cell">Vencimento</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {alunos.map(aluno => (
                       <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="font-bold text-gray-900 text-sm">{aluno.nome}</div>
                           <div className="text-xs text-gray-500">{aluno.email}</div>
                         </td>
                         <td className="px-6 py-4">
                           {aluno.status_mensalidade === 'PAGA' && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                               <CheckCircle2 size={12} strokeWidth={3} /> PAGA
                             </span>
                           )}
                           {aluno.status_mensalidade === 'PENDENTE' && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                               Pendente
                             </span>
                           )}
                           {aluno.status_mensalidade === 'ATRASADA' && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest">
                               <AlertCircle size={12} strokeWidth={3} /> Atrasada
                             </span>
                           )}
                           {aluno.status_mensalidade === 'SEM_COBRANCA' && (
                             <span className="text-xs text-gray-400 font-medium">Sem cobranças</span>
                           )}
                         </td>
                         <td className="px-6 py-4 hidden md:table-cell text-sm font-bold text-gray-900">
                           {aluno.ultima_mensalidade ? `R$ ${aluno.ultima_mensalidade.valor.toFixed(2).replace('.', ',')}` : '-'}
                         </td>
                         <td className="px-6 py-4 hidden md:table-cell text-xs text-gray-500 font-medium">
                           {aluno.ultima_mensalidade ? new Date(aluno.ultima_mensalidade.vencimento).toLocaleDateString('pt-BR') : '-'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </section>

        </div>
      </div>

      {/* MODAL NOVA COBRANÇA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !gerando && setShowModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-in">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Nova Cobrança Avulsa</h3>
              <button 
                onClick={() => setShowModal(false)}
                disabled={gerando}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <AlertCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleNovaCobranca} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Aluno</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  value={novaCobranca.user_id}
                  onChange={(e) => setNovaCobranca({ ...novaCobranca, user_id: e.target.value })}
                  disabled={gerando}
                >
                  <option value="">Selecione um aluno...</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    value={novaCobranca.valor}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, valor: e.target.value })}
                    disabled={gerando}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Referência</label>
                  <input 
                    type="text" 
                    placeholder="MM/AAAA"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    value={novaCobranca.referencia}
                    onChange={(e) => setNovaCobranca({ ...novaCobranca, referencia: e.target.value })}
                    disabled={gerando}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Vencimento</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  value={novaCobranca.data_vencimento}
                  onChange={(e) => setNovaCobranca({ ...novaCobranca, data_vencimento: e.target.value })}
                  disabled={gerando}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={gerando}
                  className="w-full bg-black text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors active:scale-95 disabled:opacity-50 flex justify-center items-center h-12"
                >
                  {gerando ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Gerar Fatura'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />}
    </div>
  );
}
