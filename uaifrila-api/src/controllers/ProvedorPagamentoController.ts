import { Response } from 'express';
import { ProvedorPagamentoService } from '../services/ProvedorPagamentoService';
import { BaseController, AuthRequest } from './BaseController';
// Admin (nível >= 90 ou SUPER_ADMIN/ADMIN). Segredos entram criptografados e saem mascarados.
export class ProvedorPagamentoController extends BaseController {
  private service = new ProvedorPagamentoService();
  listar = async (req: AuthRequest, res: Response) => {
    try {
      if (!this.isAdmin(req)) return this.error(res, 'Acesso negado', 403);
      const lista = await this.service.listarAdmin();
      return res.json({ success: true, data: lista });
    } catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      if (!this.isAdmin(req)) return this.error(res, 'Acesso negado', 403);
      const r = await this.service.atualizar(Number(req.usuario!.id), String(req.params.provedor), req.body || {});
      return res.json({ success: true, data: r, message: 'Provedor atualizado' });
    } catch (e: any) { return this.handleError(res, e); }
  };
  ativar = async (req: AuthRequest, res: Response) => {
    try {
      if (!this.isAdmin(req)) return this.error(res, 'Acesso negado', 403);
      const r = await this.service.ativar(Number(req.usuario!.id), String(req.params.provedor));
      return res.json({ success: true, data: r, message: 'Provedor ativado' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
