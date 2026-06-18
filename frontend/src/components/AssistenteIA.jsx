import React, { useState, useRef, useEffect } from 'react';
import { X, Send, BrainCircuit, Loader2, Sparkles, ChevronDown, Check, Trash2 } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function AssistenteIA({ isOpen, onClose, alunoId, alunoNome, onApplyAction }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Mensagem de boas-vindas quando abre pela primeira vez
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou o **Copiloto Inteligente** do Corpo Conectado. 🧠\n\nEstou analisando o perfil completo de **${alunoNome}** — incluindo anamnese, ficha ativa, histórico de treinos e cargas registradas.\n\nComo posso ajudar na prescrição?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, alunoNome]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setPendingAction(null);

    try {
      // Garantir que o histórico sempre comece com 'user' (exigência do Gemini)
      // Encontramos a primeira mensagem do usuário e ignoramos tudo antes dela (boas vindas, reinício, etc)
      const firstUserIdx = updatedMessages.findIndex(m => m.role === 'user');
      const mensagensValidas = firstUserIdx >= 0 ? updatedMessages.slice(firstUserIdx) : updatedMessages;

      // Preparar histórico para a API
      const apiMessages = mensagensValidas
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

      const resp = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          user_id: alunoId,
          messages: apiMessages
        })
      });

      const aiMsg = {
        role: 'assistant',
        content: resp.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);

      if (resp.action) {
        setPendingAction(resp.action);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Falha ao comunicar com o servidor. Verifique se o backend está ativo.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApplyAction = () => {
    if (pendingAction && onApplyAction) {
      onApplyAction(pendingAction);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Exercícios aplicados na ficha com sucesso! Você pode editá-los normalmente no formulário.',
        timestamp: new Date()
      }]);
      setPendingAction(null);
    }
  };

  const handleDiscardAction = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Sugestão descartada. Me avise se quiser que eu gere outra versão.',
      timestamp: new Date()
    }]);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Conversa reiniciada. Estou pronto para ajudar com **${alunoNome}**. 🧠`,
      timestamp: new Date()
    }]);
    setPendingAction(null);
  };

  // Formatar markdown simples (negrito e listas)
  const formatMessage = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '\n• ')
      .replace(/\n/g, '<br/>');
  };

  // Sugestões rápidas
  const quickActions = [
    "Analise o perfil deste aluno",
    "Gere uma ficha de treino completa",
    "Quais cuidados devo ter com este aluno?",
    "Sugira exercícios para Peito e Tríceps"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-left flex flex-col border-l border-gray-200">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide">Copiloto Inteligente</h3>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">
                {alunoNome}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition"
              title="Limpar conversa"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAFA]">

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 shrink-0 rounded-full bg-gray-900 flex items-center justify-center text-purple-400 mt-0.5 shadow-sm">
                  <Sparkles size={12} />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
              }`}>
                <p
                  className="text-[13px] font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <p className={`text-[9px] mt-1.5 font-bold ${msg.role === 'user' ? 'text-gray-500' : 'text-gray-300'}`}>
                  {msg.timestamp?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="w-7 h-7 shrink-0 rounded-full bg-gray-900 flex items-center justify-center text-purple-400 mt-0.5">
                <Sparkles size={12} />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-purple-500" />
                  <p className="text-xs font-bold text-gray-400">Analisando dados...</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Action Card */}
          {pendingAction && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-purple-600" />
                <p className="text-xs font-black text-purple-700 uppercase tracking-wider">
                  {pendingAction.tipo === 'gerar_exercicios' ? 'Treino Gerado' : 'Ação Disponível'}
                </p>
              </div>
              {pendingAction.dias && (
                <div className="space-y-2 mb-3">
                  {pendingAction.dias.map((dia, i) => (
                    <div key={i} className="bg-white border border-purple-100 rounded-xl px-3 py-2">
                      <p className="text-xs font-black text-gray-900">
                        {dia.letra_dia} — {dia.foco_muscular}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {dia.exercicios?.length || 0} exercícios
                      </p>
                      {dia.exercicios && dia.exercicios.length > 0 && (
                        <div className="space-y-1.5 mt-2.5 border-t border-purple-50 pt-2.5">
                          {dia.exercicios.map((ex, j) => (
                            <div key={j} className="flex justify-between items-center bg-gray-50/80 rounded-lg p-2">
                              <span className="text-[11px] font-bold text-gray-700 truncate pr-2">{ex.nome}</span>
                              <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded shadow-sm border border-purple-100 shrink-0">
                                {ex.series}x{ex.repeticoes}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApplyAction}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-md active:scale-95"
                >
                  <Check size={12} /> Aplicar na Ficha
                </button>
                <button
                  onClick={handleDiscardAction}
                  className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions (only when no messages from user yet) */}
          {messages.length <= 1 && !loading && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sugestões Rápidas</p>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action);
                    setTimeout(() => {
                      setInput(action);
                      sendMessage();
                    }, 50);
                  }}
                  className="w-full text-left px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition shadow-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre este aluno..."
              rows={1}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-100 outline-none transition max-h-[100px] overflow-y-auto"
              style={{ minHeight: '44px' }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[9px] font-medium text-gray-300 text-center mt-2">
            Copiloto Corpo Conectado • Powered by Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
