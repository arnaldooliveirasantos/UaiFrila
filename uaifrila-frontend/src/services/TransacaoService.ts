
import { apiFetch } from '../utils/Api';

export class TransacaoService {
  static async listar(): Promise<any[]> {
    try {
      const data = await apiFetch('/api/transacoes');
      return data.transacoes || data || [];
    } catch {
      const data = await apiFetch('/api/transacoes/minhas');
      return data.transacoes || data || [];
    }
  }
  static async minhas(): Promise<any[]> {
    const data = await apiFetch('/api/transacoes/minhas');
    return data.transacoes || data || [];
  }
}
