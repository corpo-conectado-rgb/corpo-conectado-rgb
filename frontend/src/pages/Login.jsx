import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Loader2, Eye, EyeOff, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { API_URL } from '../services/api';

export default function Login() {
  const { login, getDeviceId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [suggestedEmail, setSuggestedEmail] = useState('');
  const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');

  // Device Activation State
  const [activationState, setActivationState] = useState(
    location.state?.requiresActivation ? { code: location.state.activationCode, denied: false } : null
  );
  const [pollingActive, setPollingActive] = useState(!!location.state?.requiresActivation);
  const pollingRef = useRef(null);

  // Se veio do Onboarding com requiresActivation, limpa o state do history para não reativar num refresh
  useEffect(() => {
    if (location.state?.requiresActivation) {
      navigate('/login', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recupera o último e-mail apenas como sugestão
  useEffect(() => {
    const savedEmail = localStorage.getItem('@CorpoConectado:lastEmail');
    if (savedEmail) {
      setSuggestedEmail(savedEmail);
    }
  }, []);

  // Efeito para Mensagens Dinâmicas de Loading no Login (Cold Start UX)
  useEffect(() => {
    if (!loading) {
      setLoadingMessage('');
      return;
    }

    setLoadingMessage('');

    const messages = [
      { time: 3000, text: "Acordando servidor..." },
      { time: 8000, text: "Isso pode levar alguns segundos..." },
      { time: 15000, text: "Quase pronto..." }
    ];

    const timeouts = messages.map(msg => 
      setTimeout(() => setLoadingMessage(msg.text), msg.time)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  // Polling para verificar se o dispositivo foi aprovado
  useEffect(() => {
    if (!pollingActive || !activationState) return;

    const checkStatus = async () => {
      try {
        const deviceId = getDeviceId();
        const response = await fetch(`${API_URL}/auth/login/status-aparelho`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha: password, deviceId }),
        });
        
        const data = await response.json();
        
        if (data.approved) {
          // Dispositivo aprovado! Salvar dados e redirecionar
          setPollingActive(false);
          localStorage.setItem('@CorpoConectado:user', JSON.stringify(data.user));
          localStorage.setItem('@CorpoConectado:token', data.token);
          localStorage.setItem('@CorpoConectado:lastEmail', email);
          window.location.reload(); // Force reload to pick up new auth state
        } else if (data.denied) {
          setPollingActive(false);
          setActivationState(prev => ({ ...prev, denied: true }));
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    // Check immediately, then every 5 seconds
    checkStatus();
    pollingRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pollingActive, activationState, email, password, getDeviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setActivationState(null);

    try {
      const result = await login(email, password);
      
      if (result.requiresActivation) {
        // Dispositivo não autorizado
        if (result.activationDenied) {
          setActivationState({ code: null, denied: true });
        } else {
          setActivationState({ code: result.activationCode, denied: false });
          setPollingActive(true);
        }
        localStorage.setItem('@CorpoConectado:lastEmail', email);
      } else if (result.success) {
        localStorage.setItem('@CorpoConectado:lastEmail', email);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setActivationState(null);
    setPollingActive(false);
    if (pollingRef.current) clearInterval(pollingRef.current);
    setError('');
  };

  // ========== TELA DE AGUARDANDO ATIVAÇÃO ==========
  if (activationState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-noir-navy)] font-sans relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-noir-accent)]/40 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-[420px]">
          {/* Logo */}
          <div className="w-[80px] h-[80px] flex items-center justify-center mb-4">
            <img src="/Icone_Corpo_Conectado_Premium.png" alt="Corpo Conectado" className="w-full h-full object-contain drop-shadow-2xl pointer-events-none" />
          </div>

          {/* Card Glass */}
          <div className="w-full backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-8 px-6 sm:px-8 text-center">
            
            {activationState.denied ? (
              // === DISPOSITIVO RECUSADO ===
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <ShieldAlert size={32} className="text-red-400" />
                </div>
                <h2 className="text-lg font-black text-white mb-2">Acesso Negado</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Este dispositivo foi recusado pelo administrador. Entre em contato para solicitar acesso.
                </p>
                <button 
                  onClick={handleBackToLogin}
                  className="btn-bright w-full flex items-center justify-center gap-2"
                >
                  <LogIn size={16} /> Voltar ao Login
                </button>
              </>
            ) : (
              // === AGUARDANDO APROVAÇÃO ===
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                  <ShieldCheck size={32} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-black text-white mb-2">Ativação de Dispositivo</h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Dispositivo não reconhecido. Informe o código abaixo ao administrador para liberar seu acesso.
                </p>
                
                {/* Código de Ativação */}
                {activationState.code && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Código de Ativação</p>
                    <div className="bg-white/[0.06] border border-white/10 rounded-2xl py-4 px-6 inline-block">
                      <span className="text-3xl font-black text-white tracking-[0.3em] font-mono">
                        {activationState.code}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Status de polling */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Aguardando aprovação do administrador...</span>
                </div>
                
                <button 
                  onClick={handleBackToLogin}
                  className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider py-2"
                >
                  ← Voltar ao Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== TELA NORMAL DE LOGIN ==========
  return (
    <div className="h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-noir-navy)] font-sans relative overflow-hidden">
      
      {/* Background Glow Engine */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-noir-accent)]/40 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Container vertical centralizado */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[380px]">

        {/* Ícone — Protagonista */}
        <div className="w-[100px] h-[100px] flex items-center justify-center mb-3">
          <img src="/Icone_Corpo_Conectado_Premium.png" alt="Corpo Conectado" className="w-full h-full object-contain drop-shadow-2xl pointer-events-none" />
        </div>

        {/* Assinatura da marca */}
        <h1 className="text-sm font-semibold tracking-[0.3em] uppercase text-center text-[#C4973B] mb-6">
          Corpo Conectado
        </h1>

        {/* Card Glass */}
        <div className="w-full backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-6 px-6 sm:px-8">
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] font-black p-3 rounded-xl mb-4 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setShowEmailSuggestion(true)}
                  onBlur={() => setTimeout(() => setShowEmailSuggestion(false), 200)}
                  placeholder="seuemail@exemplo.com"
                  className="input-glass w-full"
                  required
                />
                
                {/* Custom Elegant Dropdown Suggestion */}
                {showEmailSuggestion && suggestedEmail && email !== suggestedEmail && (
                  <ul className="absolute z-50 w-full mt-1.5 bg-[#17171A] border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in text-sm font-medium">
                    <li 
                      onMouseDown={(e) => {
                        e.preventDefault(); 
                        setEmail(suggestedEmail);
                        setShowEmailSuggestion(false);
                      }}
                      className="px-[1.2rem] py-3 cursor-pointer bg-transparent hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                    >
                      {suggestedEmail}
                    </li>
                  </ul>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-glass w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-bright mt-5 w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {loading && loadingMessage && (
              <p className="text-[10px] text-gray-400 font-medium text-center mt-4 animate-fade-in tracking-wider">
                {loadingMessage}
              </p>
            )}
          </form>
          
          <div className="text-center mt-5 pt-4 border-t border-white/5">
            <Link 
              to="/onboarding"
              className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider block py-1"
            >
              Primeiro acesso? Comece por aqui
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
