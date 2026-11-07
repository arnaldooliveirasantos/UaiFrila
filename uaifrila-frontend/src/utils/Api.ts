// Api.ts UNIFICADO - ÚNICO lugar que chama o backend
// VITE_API_URL=http://192.168.24.11:3000/api  (com /api no fim)
// Por isso os caminhos são '/auth/...' '/vagas/...' SEM /api no início

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'uaifrila_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  try { localStorage.setItem('uaifrila_token', token); } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  try { localStorage.removeItem('uaifrila_token'); } catch {}
  try { localStorage.removeItem('token'); } catch {}
}

function buildUrl(path: string): string {
  // Aceita '/vagas/abertas' ou 'vagas/abertas' ou '/api/vagas/abertas' (corrige duplicação)
  let p = path.trim();
  if (p.startsWith('/api/')) p = p.slice(4); // '/api/vagas' -> '/vagas'
  if (!p.startsWith('/')) p = '/' + p;
  const base = API_URL.replace(/\/$/, '');
  return `${base}${p}`;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any || {}) };
  // SEMPRE manda o token se existir - sem isso o mural dá 401
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = buildUrl(path);
  // Log só em DEV para debugar 401
  if ((import.meta as any).env?.DEV) console.log(`[Api] ${options.method || 'GET'} ${url} token=${token ? 'SIM (' + token.slice(0, 20) + '...)' : 'NÃO'}`);
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.error || `Erro ${res.status} em ${path}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    // 401 = token inválido/expirado - limpa e manda para login, mas NÃO limpa se a rota for pública (mural)
    if (res.status === 401) {
      console.warn(`[Api] 401 em ${path} - token pode estar expirado ou rota exigindo auth indevidamente`);
    }
    throw err;
  }
  return data;
}

// Atalhos usados em vários componentes
export async function apiGet(path: string) { return apiFetch(path, { method: 'GET' }); }
export async function apiGetPublic(path: string) {
  // Para rotas públicas (mural) - manda token se tiver, mas não exige
  return apiFetch(path, { method: 'GET' });
}
export async function apiPost(path: string, body: any) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); }
export default apiFetch;
