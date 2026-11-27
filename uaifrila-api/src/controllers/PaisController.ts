import { Request, Response } from 'express';
import { PaisService } from '../services/PaisService';
import { BaseController } from './BaseController';
// Controller proprio de Pais. Antes este controller vivia dentro de CatalogosController.ts (apagar).
export class PaisController extends BaseController {
  private service = new PaisService();
  listar = async (req: Request, res: Response) => {
    try { const itens = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(itens, req), paises: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorId = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorSigla = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorSigla(req.params.sigla); if (!item) return this.error(res, 'Pais nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.atualizar(Number(req.params.id), req.body); if (!item) return this.error(res, 'Pais nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const ok = await this.service.deletar(Number(req.params.id)); if (!ok) return this.error(res, 'Pais nao encontrado', 404); return res.json({ success: true, message: 'Pais removido' }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
