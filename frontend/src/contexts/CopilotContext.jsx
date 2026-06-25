import React, { createContext, useContext, useState, useCallback } from 'react';

const CopilotContext = createContext({});

export function CopilotProvider({ children }) {
  // Controle de visibilidade global do FloatingAlfred
  const [isOpen, setIsOpen] = useState(false);
  
  // Contexto da tela ativa (ex: 'PRESCRICAO')
  const [activeContext, setActiveContext] = useState(null);
  
  // Dados específicos da tela (ex: id do aluno, nome, etc)
  const [contextData, setContextData] = useState(null);
  
  // Callbacks injetados pela tela ativa (ex: para aplicar alterações na tela)
  const [actions, setActions] = useState({});

  // Função helper para uma tela registrar seu contexto completo
  const registerContext = useCallback((contextType, data, screenActions) => {
    setActiveContext(contextType);
    if (data) setContextData(data);
    if (screenActions) setActions(screenActions);
  }, []);

  // Função helper para limpar o contexto ao sair da tela
  const clearCopilotContext = useCallback(() => {
    setActiveContext(null);
    setContextData(null);
    setActions({});
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    activeContext,
    setActiveContext,
    contextData,
    setContextData,
    actions,
    setActions,
    registerContext,
    clearCopilotContext
  };

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  return useContext(CopilotContext);
}
