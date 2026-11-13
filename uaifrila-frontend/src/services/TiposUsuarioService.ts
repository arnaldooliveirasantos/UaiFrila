
import { apiGetPublic } from '../utils/Api';

export class TiposUsuarioService {
  static async listar(): Promise<any[]> {
    const data = await apiGetPublic('/api/tipos-usuario');
    return data.tipos || data.tipos_usuario || data || [];
  }
}
