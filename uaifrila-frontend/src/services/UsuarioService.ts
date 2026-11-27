import { apiFetch, apiGetPublic } from '../utils/Api';

export class UsuarioService {
  static getTipoChave(trampar: boolean, contratar: boolean): string {
    if (trampar && contratar) return 'DUAL';
    if (trampar) return 'FREELA';
    if (contratar) return 'CONTRATANTE';
    return 'FREELA';
  }

  static parseTipoParaChecks(tipo: string): { trampar: boolean, contratar: boolean } {
    const t = (tipo||'').toUpperCase();
    if (t === 'DUAL') return { trampar: true, contratar: true };
    if (t === 'FREELA') return { trampar: true, contratar: false };
    if (t === 'CONTRATANTE') return { trampar: false, contratar: true };
    return { trampar: true, contratar: false };
  }

  static isTipoEditavel(tipo: string): boolean {
    const t = (tipo||'').toUpperCase();
    return ['FREELA','CONTRATANTE','DUAL'].includes(t);
  }

  static async me(): Promise<any> {
    const data = await apiFetch('/api/auth/me');
    return data.data || data.usuario || data;
  }

  static async listarFreelas(): Promise<any[]> {
    const data = await apiFetch('/api/usuarios/freelas');
    return data.data || data.usuarios || [];
  }
}
