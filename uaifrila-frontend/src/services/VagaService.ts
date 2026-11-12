import { apiFetch, apiGetPublic } from '../utils/Api';
// UNICO VagaService do front. APAGAR VagaServiceo.ts (duplicado, importava '../utils/api' com 'a' minusculo — quebra no Linux).
// SEMPRE via API: sem calculo local de taxa, sem vinculo local de endereco em 2a chamada solta.
export class VagaService {
  static async listar(): Promise<any[]> { const d = await apiGetPublic('/api/vagas/abertas'); return d.data || d.vagas || []; }
  static async minhas(): Promise<any[]> { const d = await apiFetch('/api/vagas/minhas'); return d.data || d.vagas || []; }
  static async minhasPublicadas(): Promise<any[]> { const d = await apiFetch('/api/vagas/minhas-publicadas'); return d.data || d.vagas || []; }
  static async calcular(dados: any): Promise<any> { const d = await apiFetch('/api/vagas/calcular', { method: 'POST', body: JSON.stringify(dados) }); return d.data || d.calculo || d; }
  static async criar(dados: any): Promise<any> { return apiFetch('/api/vagas', { method: 'POST', body: JSON.stringify(dados) }); }
  static async buscarPorId(id: number): Promise<any> { const d = await apiFetch(`/api/vagas/${id}`); return d.data || d.vaga || d; }
  static async buscarEnderecoVaga(vagaId: number): Promise<any> { try { const d = await apiGetPublic(`/api/enderecos-vaga/vaga/${vagaId}`); return d.data?.[0] || d.endereco || null; } catch { return null; } }
  static async fechar(id: number): Promise<any> { return apiFetch(`/api/vagas/${id}/fechar`, { method: 'PUT' }); }
}
