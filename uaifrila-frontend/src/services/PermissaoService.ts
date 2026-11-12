import { apiFetch } from '../utils/Api';
export class PermissaoService {
  static async matriz(): Promise<any> { const d = await apiFetch('/api/permissoes/matriz'); return d.data || d; }
  static async meuTipo(): Promise<any> { const d = await apiFetch('/api/permissoes/meu-tipo'); return d.data || d; }
}
