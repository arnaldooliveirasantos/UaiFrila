import { Request, Response } from 'express';
import { EstadoService } from '../services/EstadoService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers. NOVO: listarAtivos (GET /api/estados/ativos).
// NOVO tambem: deletar — o App ja chamava estadoCtrl.deletar, mas o metodo nao existia.
export class EstadoController extends BaseController {
  private service: EstadoService;
  constructor() { super(); this.service = new EstadoService(); }
  listar = async (req: Request, res: Response) => {
    try { const estados = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(estados, req), estados: this.mapListToPublic(estados, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarTodos = async (req: Request, res: Response) => { return this.listar(req, res); };
  listarAtivos = async (req: Request, res: Response) => {
    try { const estados = await this.service.listarAtivos(); return res.json({ success: true, data: this.mapListToPublic(estados, req), estados: this.mapListToPublic(estados, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorId = async (req: Request, res: Response) => {
    try { const estado = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(estado, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorSigla = async (req: Request, res: Response) => {
    try {
      const estado = await this.service.buscarPorSigla(req.params.sigla);
      if (!estado) return this.error(res, 'Estado nao encontrado', 404);
      return res.json({ success: true, data: this.mapToPublic(estado, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const estado = await this.service.criar(req.body);
      return res.status(201).json({ success: true, data: this.mapToPublic(estado, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const estado = await this.service.atualizar(Number(req.params.id), req.body);
      return res.json({ success: true, data: estado ? this.mapToPublic(estado, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const ok = await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, data: ok });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
