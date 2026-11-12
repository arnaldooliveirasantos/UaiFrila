import { Request, Response } from 'express';
import { TipoEnderecoService } from '../services/TipoEnderecoService';
import { BaseController } from './BaseController';
// Controller proprio de TipoEndereco. Antes este controller vivia dentro de CatalogosController.ts (apagar).
export class TipoEnderecoController extends BaseController {
  private service = new TipoEnderecoService();
  listar = async (req: Request, res: Response) => {
    try { const itens = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(itens, req), tipos_endereco: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorId = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorChave = async (req: Request, res: Response) => {
    try { const item = await this.service.buscarPorChave(req.params.chave); if (!item) return this.error(res, 'Tipo de endereco nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarAtivos = async (req: Request, res: Response) => {
    try { const itens = await this.service.listarAtivos(); return res.json({ success: true, data: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const item = await this.service.atualizar(Number(req.params.id), req.body); if (!item) return this.error(res, 'TipoEndereco nao encontrado', 404); return res.json({ success: true, data: this.mapToPublic(item, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: Request, res: Response) => {
    try { this.checkRole(req as any, ['ADMIN', 'SUPER_ADMIN']); const ok = await this.service.deletar(Number(req.params.id)); if (!ok) return this.error(res, 'TipoEndereco nao encontrado', 404); return res.json({ success: true, message: 'TipoEndereco removido' }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  // Alias que o App ja chamava (GET /api/tipos-endereco/todos), mas nao existia (500).
  // CORRIGIDO: usa Request, como os demais metodos deste arquivo.
  listarTodos = async (req: Request, res: Response) => {
    try { const lista = await this.service.listarAtivos(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
