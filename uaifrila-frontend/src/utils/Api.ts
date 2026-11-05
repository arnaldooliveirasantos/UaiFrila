// src/utils/Api.ts - FINAL com setToken
export function getApiUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  return raw.replace(/\/$/, '');
}

export function getApiBase(): string {
  const url = getApiUrl();
  return url.endsWith('/api') ? url : `${url}/api`;
}

export function getToken(): string | null {
  return localStorage.getItem('uaifrila_token') || localStorage.getItem('token') || localStorage.getItem('@UaiFrila:token');
}

export function setToken(token: string): void {
  localStorage.setItem('uaifrila_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('@UaiFrila:token', token);
  localStorage.setItem('auth_token', token);
  localStorage.setItem('@UaiFrila:usuario:token', token);
}

export function removeToken(): void {
  localStorage.removeItem('uaifrila_token');
  localStorage.removeItem('token');
  localStorage.removeItem('@UaiFrila:token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('@UaiFrila:usuario:token');
  localStorage.removeItem('uaifrila_usuario');
}

async function handleResponse(res: Response, path: string) {
  if (res.status === 401) {
    let msg = 'Nao autorizado';
    try { const j = await res.clone().json(); msg = j.message || j.erro || msg; } catch {}
    throw new Error(msg);
  }
  if (!res.ok) {
    let erroMsg = `API ${res.status} em ${path}`;
    try {
      const errData = await res.clone().json();
      erroMsg = errData.message || errData.erro || errData.error || erroMsg;
    } catch {
      try { erroMsg = await res.text(); } catch {}
    }
    throw new Error(erroMsg);
  }
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text }; }
}

function buildUrl(path: string): string {
  const base = getApiUrl().replace(/\/api$/, '');
  if (path.startsWith('http')) return path;
  let normalizedPath = path;
  if (!normalizedPath.startsWith('/api/') && !normalizedPath.startsWith('/api')) {
    normalizedPath = `/api${normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath}`;
  }
  normalizedPath = normalizedPath.replace(/\/api\/api/g, '/api');
  return `${base}${normalizedPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = buildUrl(path);
  const token = getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch(url, { ...options, headers });
  return handleResponse(res, path);
}

export async function apiGetPublic(path: string): Promise<any> {
  const url = buildUrl(path);
  const res = await fetch(url);
  return handleResponse(res, path);
}

export const Api = {
  get: (p: string) => apiGetPublic(p),
  getAuth: (p: string) => apiFetch(p),
  post: (p: string, body: any) => apiFetch(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p: string, body: any) => apiFetch(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (p: string) => apiFetch(p, { method: 'DELETE' })
};

export const api = Api;
export const API_URL = getApiUrl();

// Compat
export const getApiUrlFn = getApiUrl;
export const salvarToken = setToken;
export const limparToken = removeToken;
