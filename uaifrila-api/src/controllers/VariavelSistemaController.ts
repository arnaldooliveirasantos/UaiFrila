import { Response } from 'express';
import { VariavelSistemaService } from '../services/VariavelSistemaService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers: fino, delega para o service. Sem pool.query.
// Mesmos endpoints de antes: GET /api/variaveis, GET /api/variaveis/categoria/:categoria,
// GET /api/variaveis/:chave, PUT /api/variaveis/:chave.
export class VariavelSistemaController extends BaseController {
  private service: VariavelSistemaService;
  constructor() { super(); this.service = new VariavelSistemaService(); }
  listar = async (req: AuthRequest, res: Response) => {
    try { const itens = await this.service.listar(); const data = this.mapListToPublic(itens, req); return res.json({ success: true, data, variaveis: data }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarPorCategoria = async (req: AuthRequest, res: Response) => {
    try { const itens = await this.service.listarPorCategoria(req.params.categoria); return res.json({ success: true, data: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarPorGrupo = async (req: AuthRequest, res: Response) => { return this.listarPorCategoria(req, res); };
  buscarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      const v = await this.service.buscarPorChave(req.params.chave);
      if (!v) return this.error(res, 'Variavel nao encontrada', 404);
      return res.json({ success: true, data: this.mapToPublic(v, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  atualizarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const { valor } = req.body || {};
      if (valor === undefined || valor === null) return this.error(res, 'valor obrigatorio', 400);
      const atualizado = await this.service.atualizarPorChave(req.params.chave, String(valor));
      if (!atualizado) return this.error(res, 'Variavel nao encontrada', 404);
      return res.json({ success: true, data: this.mapToPublic(atualizado, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: AuthRequest, res: Response) => { return this.atualizarPorChave(req, res); };
}
