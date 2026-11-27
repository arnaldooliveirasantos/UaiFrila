import { apiFetch, apiGetPublic } from '../utils/Api';

export interface Cidade {
  id: number;
  nome: string;
  estado: string;
  estado_sigla: string;
  sigla?: string;
  ativa: boolean;
  ativo?: boolean;
  lat?: number;
  lng?: number;
}

export class CidadeService {
  // ===== INSTANCE METHODS (usado em PainelConfiguracaoCidades com new CidadeService()) =====
  async listar(): Promise<Cidade[]> {
    return CidadeService.listar();
  }

  async listarAtivas(): Promise<Cidade[]> {
    return CidadeService.listarAtivas();
  }

  async listarTodas(): Promise<Cidade[]> {
    return CidadeService.listarTodas();
  }

  async listarPorEstado(estadoId: number): Promise<Cidade[]> {
    return CidadeService.listarPorEstado(estadoId);
  }

  async listarPorEstadoSigla(sigla: string): Promise<Cidade[]> {
    return CidadeService.listarPorEstadoSigla(sigla);
  }

  async atualizarStatus(id: number, ativa: boolean): Promise<any> {
    return CidadeService.atualizarStatus(id, ativa);
  }

  async atualizar(id: number, dados: any): Promise<any> {
    return CidadeService.atualizar(id, dados);
  }

  // ===== STATIC METHODS =====
  // REGRA: selecao usa SO cidades ativas. /api/cidades ja devolve ativas;
  // o filtro client-side e seguranca caso o backend devolva todas.
  private static soAtivas(lista: any): Cidade[] {
    const arr = Array.isArray(lista) ? lista : [];
    return arr.filter((c: any) => c.ativa !== false && c.ativo !== false);
  }

  static async listar(): Promise<Cidade[]> {
    try {
      const data = await apiGetPublic('/api/cidades');
      const lista = data.data || data.cidades || data || [];
      return this.soAtivas(lista);
    } catch {
      try {
        const data = await apiFetch('/api/cidades');
        const lista = data.data || data.cidades || data || [];
        return this.soAtivas(lista);
      } catch { return []; }
    }
  }

  static async listarAtivas(): Promise<Cidade[]> {
    try {
      const data = await apiGetPublic('/api/cidades/ativas');
      const lista = data.data || data.cidades || data || [];
      if (Array.isArray(lista) && lista.length > 0) return this.soAtivas(lista);
    } catch {}
    return this.listar();
  }

  static async listarTodas(): Promise<Cidade[]> {
    try {
      const data = await apiGetPublic('/api/cidades/todas');
      const lista = data.data || data.cidades || data || [];
      if (Array.isArray(lista) && lista.length > 0) return lista;
    } catch {}
    try {
      const data = await apiFetch('/api/cidades/todas');
      const lista = data.data || data.cidades || data || [];
      if (Array.isArray(lista) && lista.length > 0) return lista;
    } catch {}
    return this.listar();
  }

  static async listarPorEstado(estadoId: number): Promise<Cidade[]> {
    try {
      if (!estadoId) return this.listar();
      const data = await apiGetPublic(`/api/cidades/estado/${estadoId}`);
      return this.soAtivas(data.cidades || data.data || data || []);
    } catch { return this.listar(); }
  }

  static async listarPorEstadoSigla(sigla: string): Promise<Cidade[]> {
    try {
      const data = await apiGetPublic(`/api/cidades/por-estado/${sigla}`);
      return this.soAtivas(data.cidades || data.data || data || []);
    } catch { return this.listar(); }
  }

  static async atualizarStatus(id: number, ativa: boolean): Promise<any> {
    try {
      const data = await apiFetch(`/api/cidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativa, ativo: ativa })
      });
      return data;
    } catch (e: any) {
      console.warn('[CidadeService.atualizarStatus]', e.message);
      throw e;
    }
  }

  static async atualizar(id: number, dados: any): Promise<any> {
    const data = await apiFetch(`/api/cidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
    return data;
  }

  // Aliases para compatibilidade
  static listarTodos() { return this.listarTodas(); }
  static listarAtivasAlias() { return this.listarAtivas(); }
}

export default CidadeService;
