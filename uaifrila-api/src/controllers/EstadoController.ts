
import { Request, Response } from 'express';
import { EstadoService } from '../services/EstadoService';
import { BaseController, AuthRequest } from './BaseController';

export class EstadoController extends BaseController {
  private service: EstadoService;

  constructor() {
    super();
    this.service = new EstadoService();
  }

  listar = async (req: Request, res: Response) => {
    try {
      const estados = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(estados, req), estados: this.mapListToPublic(estados, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const estado = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(estado, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorSigla = async (req: Request, res: Response) => {
    try {
      const estado = await this.service.buscarPorSigla(req.params.sigla);
      if (!estado) return this.error(res, 'Estado não encontrado', 404);
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
}
