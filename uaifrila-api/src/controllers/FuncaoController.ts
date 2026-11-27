import { Request, Response } from 'express';
import { FuncaoService } from '../services/FuncaoService';
import { BaseController } from './BaseController';
// Controller proprio de Funcao. Antes este controller vivia dentro de CatalogosController.ts (apagar).
export class FuncaoController extends BaseController {
  private service = new FuncaoService();
  listar = async (req: Request, res: Response) => {
    try { const itens = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(itens, req), funcoes: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorId = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorNome = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorNome(req.params.nome); if (!item) return this.error(res, 'Funcao nao encontrada', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarAtivas = async (req: Request, res: Response) => {
    try { const itens = await this.service.listarAtivas(); return res.json({ success: true, data: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.atualizar(Number(req.params.id), req.body); if (!item) return this.error(res, 'Funcao nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const ok = await this.service.deletar(Number(req.params.id)); if (!ok) return this.error(res, 'Funcao nao encontrado', 404); return res.json({ success: true, message: 'Funcao removido' }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
