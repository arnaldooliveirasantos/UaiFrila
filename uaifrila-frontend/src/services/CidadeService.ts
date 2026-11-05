
import { apiGetPublic } from '../utils/api';
export class CidadeService {
  static async listarPorEstado(estadoId: number): Promise<any[]> {
    const data = await apiGetPublic(`/api/estados/${estadoId}/cidades`);
    return data.cidades || [];
  }
  static listarTodos() { return this.listarPorEstado(0); }
  static listar() { return this.listarPorEstado(0); }
}
