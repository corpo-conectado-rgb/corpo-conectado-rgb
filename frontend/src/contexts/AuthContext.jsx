import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = () => {
      const storageUser = localStorage.getItem('@CorpoConectado:user');
      const storageToken = localStorage.getItem('@CorpoConectado:token');

      if (storageUser && storageToken) {
        setUser(JSON.parse(storageUser));
      }
      setLoading(false);
    };

    loadStorageData();
  }, []);

  const register = async (nome, email, password) => {
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha: password }),
      });

      const { user, token } = data;
      setUser(user);
      localStorage.setItem('@CorpoConectado:user', JSON.stringify(user));
      localStorage.setItem('@CorpoConectado:token', token);
      return true;
    } catch (error) {
      console.error("Erro no cadastro:", error.message);
      throw error;
    }
  };

  const registerFull = async (payload) => {
    try {
      const data = await apiFetch('/auth/register-full', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const { user, token } = data;
      setUser(user);
      localStorage.setItem('@CorpoConectado:user', JSON.stringify(user));
      localStorage.setItem('@CorpoConectado:token', token);
      return true;
    } catch (error) {
      console.error("Erro no cadastro onboarding:", error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha: password }), // Ensure backend expects 'senha'
      });

      const { user, token } = data;

      setUser(user);
      localStorage.setItem('@CorpoConectado:user', JSON.stringify(user));
      localStorage.setItem('@CorpoConectado:token', token);

      return true;
    } catch (error) {
      console.error("Erro no login:", error.message);
      throw error;
    }
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
    <AuthContext.Provider value={{ signed: !!user, user, login, register, registerFull, logout, loading, updateUser, refreshProfile }}>
      {children}    
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
