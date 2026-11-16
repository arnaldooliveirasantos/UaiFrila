import { Request, Response } from 'express';
import { registrarErro } from '../utils/registrarErro';
export interface AuthRequest extends Request { usuario?: { id: number; email: string; tipoUsuarioId: number; tipoChave?: string; nivelPermissao?: number; isAdmin?: boolean; }; }
export class BaseController {
  protected getUsuarioLogado(req: AuthRequest) { if (!req.usuario) throw Object.assign(new Error('Usuario nao autenticado'), { status: 401 }); return req.usuario; }
  protected isAdmin(req: AuthRequest): boolean { const u = req.usuario; if (!u) return false; return (u.nivelPermissao || 0) >= 80 || !!u.isAdmin || ['ADMIN','SUPER_ADMIN'].includes((u.tipoChave || '').toUpperCase()); }
  protected isSuperAdmin(req: AuthRequest): boolean { const u = req.usuario; return (u?.nivelPermissao || 0) >= 90 || (u?.tipoChave || '').toUpperCase() === 'SUPER_ADMIN'; }
  protected isContratante(tipoChave?: string): boolean { return (tipoChave || '').toUpperCase() !== 'FREELA'; }
  protected checkRole(req: AuthRequest, rolesPermitidos: string[]): void {
    const chave = (req.usuario?.tipoChave || '').toUpperCase(); const nivel = req.usuario?.nivelPermissao || 0;
    if (nivel >= 80 || chave === 'SUPER_ADMIN' || chave === 'ADMIN') return;
    const roles = rolesPermitidos.map(r => r.toUpperCase());
    if (roles.includes('CONTRATANTE') && chave !== 'FREELA') return;
    if (roles.includes('FREELA') && (chave === 'FREELA' || chave === 'DUAL')) return;
    if (roles.includes('DUAL') && chave !== 'FREELA') return;
    if (!roles.includes(chave)) throw Object.assign(new Error(`Acesso negado. Requer: ${rolesPermitidos.join(', ')}. Seu tipo: ${chave}`), { status: 403 });
  }
  protected checkAnyRole(req: AuthRequest, ...roles: string[]): void { this.checkRole(req, roles); }
  // UNICO formato de resposta. Aliases sendSuccess/sendError mantidos por compatibilidade, delegam para estes.
  protected success(res: Response, data: any, status = 200) { return res.status(status).json({ success: true, data }); }
  protected error(res: Response, message: string, status = 400) { return res.status(status).json({ success: false, message }); }
  protected sendSuccess(res: Response, data: any, message?: string, status = 200) { return res.status(status).json({ success: true, data: data ?? null, message }); }
  protected sendError(res: Response, message: string, status = 400) { return res.status(status).json({ success: false, message, erro: message }); }
  // SEM mascara: erro 500 nunca vira 200 com []. Erro de banco/validacao sobe com o status real.
  protected handleError(res: Response, err: any) { registrarErro('BaseController.handleError', err); const status = err?.status || err?.statusCode || 500; const message = err?.message || 'Erro interno'; return res.status(status).json({ success: false, message }); }
  protected mapToPublic(model: any, req: AuthRequest): any { if (!model) return null; if (model.toPublic) return model.toPublic(req.usuario?.id, this.isAdmin(req)); if (model.toJSON) return model.toJSON(); return model; }
  protected mapListToPublic(list: any[], req: AuthRequest): any[] { if (!Array.isArray(list)) return []; return list.map(item => this.mapToPublic(item, req)); }
}
