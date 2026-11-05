
import { apiGetPublic } from '../utils/api';

export class TiposUsuarioService {
  static async listar(): Promise<any[]> {
    const data = await apiGetPublic('/api/tipos-usuario');
    return data.tipos || data.tipos_usuario || data || [];
  }
}
