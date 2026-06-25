import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, CheckCircle, XCircle, Bell, MessageSquare } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCopilot } from '../contexts/CopilotContext';
import AssistenteIA from './AssistenteIA';

export default function FloatingAlfred() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, activeContext, contextData, actions } = useCopilot();
  const [notificacoes, setNotificacoes] = useState([]);
  const location = useLocation();
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchNotificacoes();
  }, [location.pathname]); // Atualiza as notificações ao mudar de rota

  const fetchNotificacoes = async () => {
    try {
      const data = await apiFetch('/solicitacoes/aluno/notificacoes');
      const dismissedIds = JSON.parse(localStorage.getItem('@CorpoConectado:dismissedNotifs') || '[]');
      const unreadNotifs = data.filter(n => !dismissedIds.includes(n.id));
      setNotificacoes(unreadNotifs);
    } catch (err) {
      console.error('Erro ao buscar notificações do Alfred:', err);
    }
  };

  const handleDismissNotificacao = (notif) => {
    setNotificacoes(prev => prev.filter(n => n.id !== notif.id));
    const dismissedIds = JSON.parse(localStorage.getItem('@CorpoConectado:dismissedNotifs') || '[]');
    if (!dismissedIds.includes(notif.id)) {
      dismissedIds.push(notif.id);
      localStorage.setItem('@CorpoConectado:dismissedNotifs', JSON.stringify(dismissedIds));
    }
  };

  // Fecha o popover se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Atalho de teclado Ctrl+A para abrir/fechar o Alfred
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  // Não renderizar no Dashboard ou Home, pois lá já tem o Alfred principal
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Se for Admin e estiver no contexto de Prescrição, renderizar o AssistenteIA como Drawer */}
      {user?.role === 'admin' && activeContext === 'PRESCRICAO' && (
        <AssistenteIA 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          alunoId={contextData?.alunoId}
          alunoNome={contextData?.alunoNome}
          onApplyAction={actions?.onApplyAction}
        />
      )}

      {/* Popover do Mini Chat (Para alunos ou outros contextos) */}
      {isOpen && (!activeContext || user?.role !== 'admin') && (
        <div 
          ref={popoverRef}
          className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in transform origin-bottom-right flex flex-col max-h-[80vh]"
        >
          {/* Header do Chat */}
          <div className="bg-purple-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-white font-black leading-tight">Alfred</h3>
                <p className="text-purple-200 text-xs font-medium">Seu assistente virtual</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-purple-200 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 min-h-[200px]">
            {notificacoes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-8">
                <MessageSquare size={32} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-500">Nenhuma nova mensagem.</p>
                <p className="text-xs text-gray-400">Eu avisarei quando o treinador responder suas solicitações!</p>
              </div>
            ) : (
              notificacoes.map((notif, idx) => (
                <div key={notif.id} className="animate-fade-in flex flex-col">
                  {/* Balão do Alfred */}
                  <div className={`self-start max-w-[90%] rounded-2xl rounded-tl-sm p-3.5 shadow-sm border ${notif.status === 'APROVADA' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {notif.status === 'APROVADA' ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${notif.status === 'APROVADA' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {notif.status}
                      </span>
                    </div>
                    
                    <p className={`text-xs font-medium leading-relaxed mb-2 ${notif.status === 'APROVADA' ? 'text-emerald-900' : 'text-red-900'}`}>
                      Sua solicitação de <strong>{notif.tipo === 'AJUSTE_TREINO' ? 'ajuste de treino' : 'reavaliação'}</strong> foi {notif.status.toLowerCase()}.
                    </p>
                    
                    {notif.observacao_admin && (
                      <div className={`text-xs italic p-2 rounded-xl bg-white/60 ${notif.status === 'APROVADA' ? 'text-emerald-800' : 'text-red-800'}`}>
                        "{notif.observacao_admin}"
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => handleDismissNotificacao(notif)}
                        className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors ${notif.status === 'APROVADA' ? 'bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200' : 'bg-red-200/50 text-red-700 hover:bg-red-200'}`}
                      >
                        Marcar como lida
                      </button>
                    </div>
                  </div>
                  {/* Tempo (simulado) */}
                  <span className="text-[9px] text-gray-400 font-medium ml-2 mt-1">Agora mesmo</span>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all relative"
      >
        <Bot size={28} />
        
        {/* Badge de Notificações */}
        {notificacoes.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm animate-pulse-slow">
            {notificacoes.length}
          </span>
        )}
      </button>

    </div>
  );
}
