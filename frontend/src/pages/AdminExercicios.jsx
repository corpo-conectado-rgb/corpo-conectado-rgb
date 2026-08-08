import { useState, useEffect } from 'react';
import { Dumbbell, Search, Plus, Edit2, X, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function AdminExercicios() {
  const [exercicios, setExercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEx, setCurrentEx] = useState({ codigo: '', nome: '', link_video: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    fetchExercicios();
  }, []);

  const fetchExercicios = async () => {
    try {
      const data = await apiFetch('/exercises');
      setExercicios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = exercicios.filter(ex => 
    ex.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.codigo && ex.codigo.includes(searchTerm))
  );

  const openAddModal = () => {
    setModalMode('add');
    setCurrentEx({ codigo: '', nome: '', link_video: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (ex) => {
    setModalMode('edit');
    setCurrentEx({ ...ex });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentEx.nome.trim()) {
      setErrorMsg('O nome é obrigatório.');
      return;
    }

    setModalLoading(true);
    setErrorMsg('');
    
    try {
      if (modalMode === 'add') {
        const data = await apiFetch('/exercises', {
          method: 'POST',
          body: JSON.stringify({
            nome: currentEx.nome,
            link_video: currentEx.link_video
          })
        });
        setExercicios([...exercicios, data.exercicio].sort((a, b) => parseInt(a.codigo) - parseInt(b.codigo)));
      } else {
        const data = await apiFetch(`/exercises/${currentEx.codigo}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: currentEx.nome,
            link_video: currentEx.link_video
          })
        });
        setExercicios(exercicios.map(ex => ex.codigo === currentEx.codigo ? data.exercicio : ex));
      }
      setIsModalOpen(false);
    } catch (error) {
      setErrorMsg(error.message || 'Ocorreu um erro ao salvar.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Dumbbell className="text-purple-600" /> 
            Biblioteca de Exercícios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o catálogo central e os GIFs. As alterações refletem automaticamente para todos os alunos.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-md active:scale-95"
        >
          <Plus size={16} /> Novo Exercício
        </button>
      </div>

      {/* Search and List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-20">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-sm">Carregando catálogo...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-20">
              <Dumbbell size={40} className="text-gray-200 mb-2" />
              <p className="text-base font-bold text-gray-900">Nenhum exercício encontrado</p>
              <p className="text-sm text-center max-w-xs">
                {searchTerm ? 'Tente usar outros termos de busca.' : 'O catálogo está vazio.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 w-20">CÓD.</th>
                  <th className="px-6 py-4 font-bold text-gray-500">EXERCÍCIO</th>
                  <th className="px-6 py-4 font-bold text-gray-500 w-32">GIF/VÍDEO</th>
                  <th className="px-6 py-4 font-bold text-gray-500 text-right w-24">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ex) => (
                  <tr key={ex.codigo} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-400">
                      #{String(ex.codigo).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      {ex.nome}
                    </td>
                    <td className="px-6 py-4">
                      {ex.link_video ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Cadastrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 font-bold text-xs">
                          Sem vídeo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(ex)}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center ml-auto hover:bg-black hover:text-white transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !modalLoading && setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl z-10 animate-slide-up overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">
                {modalMode === 'add' ? 'Novo Exercício' : 'Editar Exercício'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-800 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="leading-snug">{errorMsg}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Nome do Exercício
                </label>
                <input 
                  type="text" 
                  value={currentEx.nome}
                  onChange={e => setCurrentEx({...currentEx, nome: e.target.value})}
                  disabled={modalLoading}
                  placeholder="Ex: Supino Reto com Barra"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Link do GIF / Vídeo (Opcional)
                </label>
                <input 
                  type="text" 
                  value={currentEx.link_video}
                  onChange={e => setCurrentEx({...currentEx, link_video: e.target.value})}
                  disabled={modalLoading}
                  placeholder="Ex: https://site.com/video.gif"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                />
                <p className="text-[11px] text-gray-400 mt-2 leading-tight">
                  Cole o link direto da imagem (.gif) ou um link do YouTube.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={modalLoading}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl text-sm font-black hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 shadow-md"
                >
                  {modalLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                  ) : (
                    'Salvar Exercício'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
