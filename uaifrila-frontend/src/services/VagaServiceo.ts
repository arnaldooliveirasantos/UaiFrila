
import { apiFetch, apiGetPublic } from '../utils/api';

export class VagaService {
  static async listar(): Promise<any[]> {
    const data = await apiGetPublic('/api/vagas');
    return data.vagas || [];
  }

  static async minhas(): Promise<any[]> {
    const data = await apiFetch('/api/vagas/minhas');
    return data.vagas || [];
  }

  static async calcular(dados: any): Promise<any> {
    const data = await apiFetch('/api/vagas/calcular', { method: 'POST', body: JSON.stringify(dados) });
    return data.calculo || data;
  }

  static async criar(dados: any): Promise<any> {
    // dados deve conter endereco_id
    const { endereco_id, ...resto } = dados;
    const result = await apiFetch('/api/vagas', { method: 'POST', body: JSON.stringify(resto) });
    
    // Se tem endereco_id, vincula
    if (endereco_id && result.vaga?.id) {
      try {
        await apiFetch('/api/enderecos/vincular-vaga', {
          method: 'POST',
          body: JSON.stringify({ endereco_id, vaga_id: result.vaga.id })
        });
      } catch (e) {
        console.warn('Erro ao vincular endereço à vaga', e);
      }
    }
    
    return result;
  }

  static async buscarEnderecoVaga(vagaId: number): Promise<any> {
    try {
      const data = await apiGetPublic(`/api/enderecos/vaga/${vagaId}`);
      return data.endereco;
    } catch {
      return null;
    }
  }
}
