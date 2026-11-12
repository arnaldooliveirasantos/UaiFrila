// src/utils/Api.ts - ÚNICA fonte de API no frontend. SEM MOCK, SEM FALLBACK.
// REMOVA src/services/Api.ts (duplicado, com API_URL hardcoded localhost:3000/api).
// Todos os arquivos devem importar daqui: import { apiFetch, apiGetPublic, getToken, setToken, clearAuth } from '../utils/Api';
// - apiFetch: com token (rotas protegidas). Sem token -> erro, NÃO inventa dado.
// - apiGetPublic: sem token (cidades, estados, tipos, auth). Sem token -> erro, NÃO inventa dado.
// - NENHUM componente pode usar fetch() direto com VITE_API_URL próprio, nem localStorage como fonte de verdade.
// - NENHUM componente pode ter array fixo de dados (João/Maria, Uberlândia) como fallback de API.

export function getApiUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (!raw) throw new Error('VITE_API_URL não definido no .env - crie .env com VITE_API_URL=http://192.168.24.11:3000');
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}
export function getToken(): string | null {
  return localStorage.getItem('uaifrila_token') || localStorage.getItem('token');
}
export function setToken(token: string) { localStorage.setItem('uaifrila_token', token); }
export function clearAuth() {
  localStorage.removeItem('uaifrila_token'); localStorage.removeItem('token');
  localStorage.removeItem('uaifrila_usuario');
}
// join() SEMPRE garante /api no path.
// BUG que gerava POST http://192.168.24.11:3000/auth/solicitar-codigo 404:
// getApiUrl() tira o /api do VITE_API_URL (http://...:3000/api -> http://...:3000),
// mas o join antigo só concatenava: base + '/auth/solicitar-codigo' = sem /api.
// O backend SÓ tem /api/auth/... -> 404.
// AGORA: '/auth/...' -> '/api/auth/...' | '/api/auth/...' -> '/api/auth/...' (não duplica)
// Funciona com VITE_API_URL com ou sem /api no fim, e com chamador com ou sem /api.
function join(path: string) {
  if (path.startsWith('http')) {
    try {
      const u = new URL(path);
      if (!u.pathname.startsWith('/api/') && u.pathname !== '/api') u.pathname = '/api' + (u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname);
      return u.toString();
    } catch { return path; }
  }
  const base = getApiUrl(); // já sem /api no fim
  const p = path.startsWith('/') ? path : '/' + path;
  const comApi = p.startsWith('/api/') || p === '/api' ? p : '/api' + p;
  const url = `${base}${comApi}`;
  if ((import.meta as any).env?.DEV) console.log(`[Api] join ${path} -> ${url}`);
  return url;
}
async function lerErro(res: Response, path: string) {
  let msg = `API ${res.status} em ${path}`;
  try { const j = await res.json(); msg = j.erro || j.message || j.error || msg; } catch {}
  return new Error(msg);
}
// Rotas protegidas - exigem token. Se 401, limpa auth e lança erro (o App redireciona para login).
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const res = await fetch(join(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    // NÃO limpa auth em 401 de rota pública (mural/abertas/cidades/estados).
    // ANTES: qualquer 401 (ex: mural sem token) fazia clearAuth() e apagava o token válido,
    // aí auth/me, minhas e tipos-usuario também davam 401 em cascata.
    // AGORA: só limpa quando o 401 é do /auth/me (token realmente inválido).
    if (res.status === 401 && path.includes('/auth/me')) clearAuth();
    throw await lerErro(res, path);
  }
  return res.json();
}
// Rotas públicas - sem token.
export async function apiGetPublic(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(join(path), { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!res.ok) throw await lerErro(res, path);
  return res.json();
}
export const Api = {
  get: (p: string) => apiGetPublic(p),
  getAuth: (p: string) => apiFetch(p),
  post: (p: string, body: any) => apiFetch(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p: string, body: any) => apiFetch(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (p: string) => apiFetch(p, { method: 'DELETE' }),
};
export default Api;
