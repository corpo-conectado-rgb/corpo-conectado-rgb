import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share, PlusSquare, ChevronRight } from 'lucide-react';

// Detecta plataforma
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const STORAGE_KEY = '@CorpoConectado:installDismissed';
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'android' | 'ios' | 'unknown'
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) return;

    // Don't show if user dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
      // Show after a short delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    } else if (isAndroid()) {
      setPlatform('android');
    }

    // Listen for Chrome's install prompt (Android + Desktop Chrome)
    const handler = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setPlatform(prev => prev === 'unknown' ? 'android' : prev);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
      }
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal */}
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 animate-fade-in text-center">
        {/* Close */}
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-purple-600/20 border-2 border-purple-100">
          <img src="/Icone_Corpo_Conectado_Premium.png" alt="Corpo Conectado" className="w-full h-full object-cover" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-1">
          Instalar Corpo Conectado
        </h2>
        <p className="text-sm text-gray-500 font-medium mb-5">
          Acesse mais rápido direto da sua tela inicial, como um app nativo.
        </p>

        {platform === 'ios' ? (
          /* ─── iOS Instructions ─── */
          <div className="space-y-4 text-left mb-5">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                <Share size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">1. Toque em Compartilhar</p>
                <p className="text-xs text-gray-500 mt-0.5">Toque no ícone <span className="inline-block align-middle">⬆️</span> na barra inferior do Safari.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                <PlusSquare size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">2. Adicionar à Tela de Início</p>
                <p className="text-xs text-gray-500 mt-0.5">Role a lista e toque em <span className="font-bold text-gray-700">"Adicionar à Tela de Início"</span>.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Download size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">3. Confirme</p>
                <p className="text-xs text-gray-500 mt-0.5">Toque em <span className="font-bold text-gray-700">"Adicionar"</span> no canto superior direito.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ─── Android / Desktop CTA ─── */
          <div className="mb-4">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all text-sm shadow-lg shadow-purple-600/20"
            >
              <Download size={18} />
              Instalar Agora
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
