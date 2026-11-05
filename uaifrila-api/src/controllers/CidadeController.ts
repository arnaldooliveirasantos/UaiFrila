
import { Request, Response } from 'express';
import { CidadeService } from '../services/CidadeService';
import { EstadoService } from '../services/EstadoService';
import { BaseController, AuthRequest } from './BaseController';

export class CidadeController extends BaseController {
  private service: CidadeService;
  private estadoService: EstadoService;

  constructor() {
    super();
    this.service = new CidadeService();
    this.estadoService = new EstadoService();
  }

  listar = async (req: Request, res: Response) => {
    try {
      const cidades = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(cidades, req), cidades: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  ativas = async (req: Request, res: Response) => {
    try {
      const cidades = await this.service.listarAtivas();
      return res.json({ success: true, data: this.mapListToPublic(cidades, req), cidades: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorEstado = async (req: Request, res: Response) => {
    try {
      const estadoId = Number(req.params.estadoId);
      const cidades = await this.service.listarPorEstado(estadoId);
      return res.json({ success: true, data: this.mapListToPublic(cidades, req), cidades: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const cidade = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(cidade, req), cidade: this.mapToPublic(cidade, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const cidade = await this.service.criar(req.body);
      return res.status(201).json({ success: true, data: this.mapToPublic(cidade, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const cidade = await this.service.atualizar(Number(req.params.id), req.body);
      return res.json({ success: true, data: cidade ? this.mapToPublic(cidade, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, message: 'Cidade deletada' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
