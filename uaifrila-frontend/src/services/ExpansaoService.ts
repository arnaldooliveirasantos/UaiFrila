import { apiFetch } from '../utils/Api';
// SEM fetch direto, SEM VITE_API_URL proprio, SEM fallback localhost.
export class ExpansaoService {
  static async listar(): Promise<any[]> { const d = await apiFetch('/api/expansao'); return d.data || []; }
  static async solicitar(body: any): Promise<any> { return apiFetch('/api/expansao/solicitar', { method: 'POST', body: JSON.stringify(body) }); }
}
