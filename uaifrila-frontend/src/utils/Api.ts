// src/utils/Api.ts - CORRIGE A URL: garante /api na URL, sempre
// Antes:  http://192.168.24.11:3000/estados  -> 404 (faltava /api na URL)
// Depois: http://192.168.24.11:3000/api/estados -> 200
// Regra: VITE_API_URL pode ser com ou sem /api. O join() normaliza tudo.
//   VITE_API_URL=http://192.168.24.11:3000       + '/estados'     -> http://192.168.24.11:3000/api/estados
//   VITE_API_URL=http://192.168.24.11:3000       + '/api/estados' -> http://192.168.24.11:3000/api/estados (não duplica)
//   VITE_API_URL=http://192.168.24.11:3000/api   + '/estados'     -> http://192.168.24.11:3000/api/estados
// NUNCA use fetch(`${VITE_API_URL}/estados`) solto. Use apiFetch / apiGetPublic daqui.

export function getApiUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (!raw) throw new Error('VITE_API_URL não definido no .env - crie .env com VITE_API_URL=http://192.168.24.11:3000');
  return raw.replace(/\/$/, '');
}
export function getToken(): string | null {
  return localStorage.getItem('uaifrila_token') || localStorage.getItem('token');
}
export function setToken(token: string) { localStorage.setItem('uaifrila_token', token); }
export function clearAuth() {
  localStorage.removeItem('uaifrila_token'); localStorage.removeItem('token'); localStorage.removeItem('uaifrila_usuario');
}
function join(path: string): string {
  if (path.startsWith('http')) {
    try {
      const u = new URL(path);
      if (!u.pathname.startsWith('/api/') && u.pathname !== '/api') u.pathname = '/api' + (u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname);
      return u.toString();
    } catch { return path; }
  }
  const base = getApiUrl().replace(/\/api\/?$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  const comApi = p.startsWith('/api/') || p === '/api' ? p : '/api' + p;
  return `${base}${comApi}`;
}
async function lerErro(res: Response, path: string) {
  let msg = `API ${res.status} em ${path} - URL final: ${join(path)}`;
  try { const j = await res.json(); msg = j.erro || j.message || j.error || msg; } catch {}
  return new Error(msg);
}
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const url = join(path);
  console.log(`[Api] ${options.method || 'GET'} ${url}`);
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!res.ok) { if (res.status === 401) clearAuth(); throw await lerErro(res, path); }
  return res.json();
}
export async function apiGetPublic(path: string, options: RequestInit = {}): Promise<any> {
  const url = join(path);
  console.log(`[Api] GET ${url}`);
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
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
