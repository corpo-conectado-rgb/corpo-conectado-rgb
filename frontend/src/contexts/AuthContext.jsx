import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { API_URL } from '../services/api';

const AuthContext = createContext({});

// Gera ou recupera um ID único para este dispositivo
function getDeviceId() {
  let deviceId = localStorage.getItem('@CorpoConectado:deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('@CorpoConectado:deviceId', deviceId);
  }
  return deviceId;
}

// Detecta o nome do dispositivo baseado no User Agent
function getDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone Safari';
  if (/iPad/i.test(ua)) return 'iPad Safari';
  if (/Android/i.test(ua) && /Chrome/i.test(ua)) return 'Chrome Android';
  if (/Android/i.test(ua)) return 'Android Browser';
  if (/Chrome/i.test(ua)) return 'Chrome Desktop';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari Desktop';
  if (/Edge/i.test(ua)) return 'Microsoft Edge';
  return 'Navegador desconhecido';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      const storageUser = localStorage.getItem('@CorpoConectado:user');
      const storageToken = localStorage.getItem('@CorpoConectado:token');

      if (storageUser && storageToken) {
        setUser(JSON.parse(storageUser));
        setLoading(false); // Render instantly with cached data
        
        // Sync fresh data silently in the background (cold start safe)
        try {
          const data = await apiFetch('/auth/me');
          setUser(data);
          localStorage.setItem('@CorpoConectado:user', JSON.stringify(data));
        } catch (err) {
          console.error('Background profile sync failed:', err.message);
        }
      } else {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const register = async (nome, email, password) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha: password }),
      });

      return await login(email, password);
    } catch (error) {
      console.error("Erro no cadastro:", error.message);
      throw error;
    }
  };

  const registerFull = async (payload) => {
    try {
      await apiFetch('/auth/register-full', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return await login(payload.email, payload.senha);
    } catch (error) {
      console.error("Erro no cadastro onboarding:", error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    const deviceId = getDeviceId();
    const deviceName = getDeviceName();
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: password, deviceId, deviceName }),
    });
    
    const data = await response.json();
    
    // Se o dispositivo precisa de ativação, retorna o objeto para o Login.jsx tratar
    if (!response.ok && data.requiresActivation) {
      return { requiresActivation: true, ...data };
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erro no login');
    }

    const { user, token } = data;
    setUser(user);
    localStorage.setItem('@CorpoConectado:user', JSON.stringify(user));
    localStorage.setItem('@CorpoConectado:token', token);

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('@CorpoConectado:user');
    localStorage.removeItem('@CorpoConectado:token');
    setUser(null);
  };

  // Atualiza parcialmente os dados do usuário no estado e localStorage
  const updateUser = (partialData) => {
    setUser(prev => {
      const updated = { ...prev, ...partialData };
      localStorage.setItem('@CorpoConectado:user', JSON.stringify(updated));
      return updated;
    });
  };

  // Recarrega o perfil completo do backend (GET /auth/me)
  const refreshProfile = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data);
      localStorage.setItem('@CorpoConectado:user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Erro ao recarregar perfil:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, register, registerFull, logout, loading, updateUser, refreshProfile, getDeviceId }}>
      {children}    
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
