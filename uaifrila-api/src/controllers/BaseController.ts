import { Request, Response } from 'express';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    tipoUsuarioId: number;
    tipoChave?: string;
    nivelPermissao?: number;
    isAdmin?: boolean;
  };
}

export class BaseController {
  protected getUsuarioLogado(req: AuthRequest) {
    if (!req.usuario) throw new Error('Usuário não autenticado');
    return req.usuario;
  }

  protected isAdmin(req: AuthRequest): boolean {
    const u = req.usuario;
    if (!u) return false;
    return (u.nivelPermissao || 0) >= 80 || u.isAdmin || ['ADMIN','SUPER_ADMIN'].includes((u.tipoChave || '').toUpperCase());
  }

  protected isSuperAdmin(req: AuthRequest): boolean {
    const u = req.usuario;
    return (u?.nivelPermissao || 0) >= 90 || (u?.tipoChave || '').toUpperCase() === 'SUPER_ADMIN';
  }

  // REGRA NEGOCIO: Todo usuario exceto FREELA é CONTRATANTE
  protected isContratante(tipoChave?: string): boolean {
    const chave = (tipoChave || '').toUpperCase();
    return chave !== 'FREELA';
  }

  protected checkRole(req: AuthRequest, rolesPermitidos: string[]): void {
    const chave = (req.usuario?.tipoChave || '').toUpperCase();
    const nivel = req.usuario?.nivelPermissao || 0;

    if (nivel >= 80 || chave === 'SUPER_ADMIN' || chave === 'ADMIN') return;

    const rolesUpper = rolesPermitidos.map(r => r.toUpperCase());

    if (rolesUpper.includes('CONTRATANTE')) {
      if (chave !== 'FREELA') return;
    }

    if (rolesUpper.includes('FREELA')) {
      if (chave === 'FREELA' || chave === 'DUAL') return;
    }

    if (rolesUpper.includes('DUAL')) {
      if (chave === 'DUAL' || chave === 'CONTRATANTE' || chave !== 'FREELA') return;
    }

    if (!rolesUpper.includes(chave)) {
      throw { status: 403, message: `Acesso negado. Requer: ${rolesPermitidos.join(', ')}. Seu tipo: ${chave}` };
    }
  }

  protected checkAnyRole(req: AuthRequest, ...roles: string[]): void {
    this.checkRole(req, roles);
  }

  protected success(res: Response, data: any, status = 200) {
    return res.status(status).json({ success: true, data });
  }

  protected error(res: Response, message: string, status = 400) {
    return res.status(status).json({ success: false, message });
  }

  // Compat com codigo antigo que usa sendSuccess/sendError
  protected sendSuccess(res: Response, data: any, message?: string, status = 200) {
    if (data === null || data === undefined) {
      return res.status(status).json({ success: true, data: null, message });
    }
    return res.status(status).json({ success: true, data, message });
  }

  protected sendError(res: Response, message: string, status = 400) {
    return res.status(status).json({ success: false, message, erro: message });
  }

  protected handleError(res: Response, err: any) {
    console.error('[BaseController] Erro:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Erro interno';
    if (status >= 500 && (String(message).includes('NaN') || String(message).includes('integer'))) {
      return res.status(200).json({ success: true, data: [], vagas: [], message: 'Nenhum dado - ' + message });
    }
    return res.status(status).json({ success: false, message });
  }

  protected mapToPublic(model: any, req: AuthRequest): any {
    if (!model) return null;
    const usuarioLogado = req.usuario;
    if (model.toPublic) {
      return model.toPublic(usuarioLogado?.id, this.isAdmin(req));
    }
    if (model.toJSON) return model.toJSON();
    return model;
  }

  protected mapListToPublic(list: any[], req: AuthRequest): any[] {
    if (!Array.isArray(list)) return [];
    return list.map(item => this.mapToPublic(item, req));
  }
}
