import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, CheckCircle, XCircle, Trash2, Shield, ToggleLeft, ToggleRight, Monitor, User, X } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function AdminConfiguracoes() {
  // Configuração global
  const [requireActivation, setRequireActivation] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Dispositivos
  const [dispositivos, setDispositivos] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [filter, setFilter] = useState('PENDENTE');
  const [submitting, setSubmitting] = useState(false);

  // Modal de exclusão
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, nome: '' });

  useEffect(() => {
    fetchConfig();
    fetchDispositivos();
  }, []);

  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      const data = await apiFetch('/config');
      // O backend retorna um objeto { REQUIRE_DEVICE_ACTIVATION: 'true', ... }
      setRequireActivation(data.REQUIRE_DEVICE_ACTIVATION === 'true');
    } catch (err) {
      console.error('Erro ao carregar configuração:', err.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const toggleActivation = async () => {
    try {
      setToggling(true);
      const novoValor = !requireActivation;
      await apiFetch('/config', {
        method: 'PUT',
        body: JSON.stringify({ chave: 'REQUIRE_DEVICE_ACTIVATION', valor: novoValor ? 'true' : 'false' })
      });
      setRequireActivation(novoValor);
    } catch (err) {
      alert('Erro ao atualizar configuração: ' + err.message);
    } finally {
      setToggling(false);
    }
  };

  const fetchDispositivos = async () => {
    try {
      setDevicesLoading(true);
      const data = await apiFetch('/config/dispositivos');
      setDispositivos(data);
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err.message);
    } finally {
      setDevicesLoading(false);
    }
  };

  const aprovarDispositivo = async (id) => {
    try {
      setSubmitting(true);
      await apiFetch(`/config/dispositivos/${id}/aprovar`, { method: 'PUT' });
      setDispositivos(prev => prev.map(d =>
        d.id === id ? { ...d, status: 'AUTORIZADO' } : d
      ));
    } catch (err) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const recusarDispositivo = async (id) => {
    try {
      setSubmitting(true);
      await apiFetch(`/config/dispositivos/${id}/recusar`, { method: 'PUT' });
      setDispositivos(prev => prev.map(d =>
        d.id === id ? { ...d, status: 'RECUSADO' } : d
      ));
    } catch (err) {
      alert('Erro ao recusar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deletarDispositivo = async () => {
    if (!deleteModal.id) return;
    try {
      setSubmitting(true);
      await apiFetch(`/config/dispositivos/${deleteModal.id}`, { method: 'DELETE' });
      setDispositivos(prev => prev.filter(d => d.id !== deleteModal.id));
      fecharDeleteModal();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fecharDeleteModal = () => {
    setDeleteModal({ show: false, id: null, nome: '' });
  };

  const filteredDispositivos = dispositivos.filter(d => {
    if (filter === 'TODOS') return true;
    if (filter === 'PENDENTE') return d.status === 'PENDENTE';
    if (filter === 'AUTORIZADO') return d.status === 'AUTORIZADO';
    return true;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-50 text-amber-600 border-amber-200/50';
      case 'AUTORIZADO': return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
      case 'RECUSADO': return 'bg-red-50 text-red-600 border-red-200/50';
      default: return 'bg-gray-50 text-gray-600 border-gray-200/50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'AUTORIZADO': return 'Autorizado';
      case 'RECUSADO': return 'Recusado';
      default: return status;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = dispositivos.filter(d => d.status === 'PENDENTE').length;

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Settings size={28} className="text-gray-400" /> Configurações
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Gerencie as configurações globais e licenças de dispositivos.
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 lg:pb-8 overflow-y-auto bg-gray-50/50">
        <div className="max-w-4xl mx-auto xl:max-w-6xl py-4 space-y-8">

          {/* ─────────── Section 1: Configurações Globais ─────────── */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Shield size={14} /> Configurações Globais
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Smartphone size={20} className="text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 mb-1">Solicitar Ativação de Dispositivo</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      Quando ativado, novos acessos exigirão aprovação do administrador antes de liberar o dispositivo.
                    </p>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  onClick={toggleActivation}
                  disabled={configLoading || toggling}
                  className="shrink-0 focus:outline-none disabled:opacity-50 transition-opacity"
                  title={requireActivation ? 'Desativar' : 'Ativar'}
                >
                  {configLoading ? (
                    <div className="w-14 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : requireActivation ? (
                    <div className="relative w-14 h-8 bg-emerald-500 rounded-full transition-colors shadow-inner cursor-pointer">
                      <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all flex items-center justify-center">
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-14 h-8 bg-gray-300 rounded-full transition-colors shadow-inner cursor-pointer">
                      <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all flex items-center justify-center">
                        <XCircle size={14} className="text-gray-400" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ─────────── Section 2: Licenças de Dispositivos ─────────── */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Monitor size={14} /> Licenças de Dispositivos
                {pendingCount > 0 && (
                  <span className="flex items-center justify-center bg-red-500 text-white text-[9px] rounded-full h-5 px-2 font-bold shadow-sm ml-1">
                    {pendingCount}
                  </span>
                )}
              </h2>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                {['PENDENTE', 'AUTORIZADO', 'TODOS'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-xs lg:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {f === 'PENDENTE' ? 'Pendentes' : f === 'AUTORIZADO' ? 'Autorizados' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {devicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              </div>
            ) : filteredDispositivos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <Smartphone className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-black text-gray-900">Nenhum dispositivo {filter === 'PENDENTE' ? 'pendente' : filter === 'AUTORIZADO' ? 'autorizado' : 'encontrado'}</h3>
                <p className="text-sm text-gray-500 font-medium">Nenhuma licença para exibir neste filtro.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDispositivos.map(disp => (
                  <div key={disp.id} className={`group relative bg-white rounded-2xl border ${disp.status === 'PENDENTE' ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-75'} p-4 md:p-5 transition-all`}>
                    {/* Botão Excluir hover */}
                    <button
                      onClick={() => setDeleteModal({ show: true, id: disp.id, nome: disp.usuario_nome || 'Usuário' })}
                      className="absolute top-3 right-3 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full"
                      title="Excluir Dispositivo"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 font-black shadow-sm shrink-0">
                          {disp.usuario_nome ? disp.usuario_nome.charAt(0).toUpperCase() : <User size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Nome + Status Badge */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-black text-gray-900 truncate">{disp.usuario_nome || 'Usuário'}</h3>
                            <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border ${getStatusStyle(disp.status)}`}>
                              {getStatusLabel(disp.status)}
                            </span>
                          </div>

                          {/* Email */}
                          <p className="text-xs text-gray-400 font-medium mb-3 truncate">{disp.usuario_email || '--'}</p>

                          {/* Info Card */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Monitor size={16} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 font-medium">{disp.dispositivo_nome || 'Dispositivo desconhecido'}</span>
                            </div>
                            <div className="sm:ml-auto flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Código</span>
                              <span className="text-lg font-black text-gray-900 font-mono tracking-[0.2em] bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm select-all">
                                {disp.codigo_ativacao || '------'}
                              </span>
                            </div>
                          </div>

                          {/* Data */}
                          <div className="text-xs font-medium text-gray-400 mt-3">
                            Solicitado em {formatDate(disp.data_criacao)}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      {disp.status === 'PENDENTE' && (
                        <div className="flex flex-row md:flex-col items-center justify-start md:justify-end gap-2 shrink-0 md:pl-4 md:border-l border-gray-100 md:w-36 lg:w-44 pt-2 md:pt-8">
                          <button
                            onClick={() => aprovarDispositivo(disp.id)}
                            disabled={submitting}
                            className="px-4 py-2 w-full flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white transition active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> Aprovar
                          </button>
                          <button
                            onClick={() => recusarDispositivo(disp.id)}
                            disabled={submitting}
                            className="px-4 py-2 w-full flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition active:scale-95 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Recusar
                          </button>
                        </div>
                      )}

                      {disp.status !== 'PENDENTE' && (
                        <div className="flex flex-row md:flex-col items-center justify-start md:justify-end gap-2 shrink-0 md:pl-4 md:border-l border-gray-100 md:w-36 lg:w-44 pt-2 md:pt-8">
                          <div className={`px-4 py-2 w-full flex justify-center items-center gap-1.5 text-xs font-black uppercase tracking-wider ${disp.status === 'AUTORIZADO' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {disp.status === 'AUTORIZADO' ? <><CheckCircle size={14} /> Autorizado</> : <><XCircle size={14} /> Recusado</>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Modal de Exclusão */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={fecharDeleteModal} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden text-center p-6">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Excluir Dispositivo?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Você está prestes a excluir o registro de dispositivo de <span className="font-bold text-gray-900">{deleteModal.nome}</span>. Esta ação não poderá ser desfeita.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={deletarDispositivo}
                disabled={submitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
              >
                {submitting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
              <button
                onClick={fecharDeleteModal}
                disabled={submitting}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black uppercase tracking-widest text-xs py-4 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
