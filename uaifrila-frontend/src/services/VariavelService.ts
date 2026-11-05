import { apiFetch, apiGetPublic } from '../utils/Api';

export interface VariavelSistema {
  id: number;
  chave: string;
  valor: string;
  valor_numerico?: number;
  descricao?: string;
  categoria?: string;
}

export class VariavelService {
  async listar(): Promise<VariavelSistema[]> {
    try {
      const data = await apiFetch('/api/variaveis');
      const lista = data.variaveis || data.data || data || [];
      return Array.isArray(lista) ? lista : [];
    } catch (e: any) {
      console.warn('[VariavelService.listar] erro', e.message);
      return [];
    }
  }

  // Compat estático
  static async listar(): Promise<any[]> {
    try {
      const inst = new VariavelService();
      return await inst.listar();
    } catch { return []; }
  }

  static listarTodos() { return this.listar(); }
  static listarAtivas() { return this.listar(); }

  listarTodos() { return this.listar(); }
  listarAtivas() { return this.listar(); }

  async atualizar(chave: string, valor: string): Promise<any> {
    return await apiFetch(`/api/variaveis/chave/${chave}`, {
      method: 'PUT',
      body: JSON.stringify({ valor })
    });
  }

  static async atualizar(chave: string, valor: string): Promise<any> {
    const inst = new VariavelService();
    return await inst.atualizar(chave, valor);
  }

  async buscarPorChave(chave: string): Promise<VariavelSistema | null> {
    try {
      const data = await apiFetch(`/api/variaveis/chave/${chave}`);
      return data.data || data || null;
    } catch { return null; }
  }
}
