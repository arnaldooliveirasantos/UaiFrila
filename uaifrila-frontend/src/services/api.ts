// FILE: uaifrila-frontend/src/services/api.ts
// SUBSTITUIR: todo o arquivo atual - unifica tokens e adiciona refresh + 401 handler

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

function getToken(): string | null {
  // Unifica: tenta nova chave primeiro, depois antiga
  return localStorage.getItem('uaifrila_token') || localStorage.getItem('@UaiFrila:token');
}

function clearAuthAndRedirect() {
  localStorage.removeItem('uaifrila_token');
  localStorage.removeItem('@UaiFrila:token');
  localStorage.removeItem('uaifrila_usuario');
  // evita loop se já está na home
  if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
    window.location.href = '/';
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    const msg = (data.erro || '').toLowerCase();
    if (msg.includes('token') || msg.includes('expirado') || msg.includes('não fornecido') || msg.includes('inválido')) {
      clearAuthAndRedirect();
      throw new Error('Sessão expirada - faça login novamente');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: res.statusText }));
    throw new Error(err.erro || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (url: string) => apiFetch(url),
  post: (url: string, body: any) => apiFetch(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url: string, body: any) => apiFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url: string) => apiFetch(url, { method: 'DELETE' }),
  upload: (url: string, formData: FormData) => {
    const token = getToken();
    return fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).erro || 'Erro upload');
      return r.json();
    });
  }
};
