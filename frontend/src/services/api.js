// Em produção, VITE_API_URL é definida na Vercel apontando para o Render.
// Em desenvolvimento, usa localhost:3000.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('@CorpoConectado:token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = errorDetails.message || errorDetails.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
};
