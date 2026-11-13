
import { apiGetPublic } from '../utils/Api';
export class EstadoService {
  static async listarTodos(): Promise<any[]> {
    const data = await apiGetPublic('/api/estados');
    if (!data.estados) throw new Error('API sem estados');
    return data.estados;
  }
  static async listarAtivos(): Promise<any[]> {
    const data = await apiGetPublic('/api/estados/ativos');
    return data.estados || data;
  }
  static listar() { return this.listarTodos(); }
}
