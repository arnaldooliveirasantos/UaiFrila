import { Request, Response } from 'express';
import { StatusUsuarioService } from '../services/StatusUsuarioService';
import { BaseController } from './BaseController';
// Controller proprio de StatusUsuario. Antes este controller vivia dentro de CatalogosController.ts (apagar).
export class StatusUsuarioController extends BaseController {
  private service = new StatusUsuarioService();
  listar = async (req: Request, res: Response) => {
    try { const itens = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(itens, req), status_usuario: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorId = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorChave = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorChave(req.params.chave); if (!item) return this.error(res, 'Status nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.atualizar(Number(req.params.id), req.body); if (!item) return this.error(res, 'StatusUsuario nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const ok = await this.service.deletar(Number(req.params.id)); if (!ok) return this.error(res, 'StatusUsuario nao encontrado', 404); return res.json({ success: true, message: 'StatusUsuario removido' }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
