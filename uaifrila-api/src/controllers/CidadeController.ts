import { Response } from 'express';
import { CidadeService } from '../services/CidadeService';
import { BaseController, AuthRequest } from './BaseController';

export class CidadeController extends BaseController {
  private service: CidadeService;
  constructor() { super(); this.service = new CidadeService(); }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const cidades = await this.service.listarAtivas();
      return res.json({ success: true, data: this.mapListToPublic(cidades, req), cidades: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarTodas = async (req: AuthRequest, res: Response) => {
    try {
      // Se não for admin, retorna ativas mesmo
      const cidades = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(cidades, req), cidades: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorEstado = async (req: any, res: Response) => {
    try {
      const estadoId = Number(req.params.estadoId);
      const cidades = await this.service.listarPorEstado(estadoId);
      return res.json({ success: true, cidades: this.mapListToPublic(cidades, req), data: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorEstadoSigla = async (req: any, res: Response) => {
    try {
      const { sigla } = req.params;
      const cidades = await this.service.listarPorEstadoSigla(sigla);
      return res.json({ success: true, cidades: this.mapListToPublic(cidades, req), data: this.mapListToPublic(cidades, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const cidade = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(cidade, req) });
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
      
      // FIX: mapeia ativo -> ativa
      const body = { ...req.body };
      if (body.ativo !== undefined && body.ativa === undefined) {
        body.ativa = body.ativo;
        delete body.ativo;
      }
      delete body.ativo;
      delete body.estado_sigla;
      
      console.log(`[CidadeController.atualizar] id=${req.params.id} body=`, body);
      
      const cidade = await this.service.atualizar(Number(req.params.id), body);
      return res.json({ success: true, data: this.mapToPublic(cidade, req) });
    } catch (e: any) { 
      console.error('[CidadeController.atualizar] erro', e.message);
      return this.handleError(res, e); 
    }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['SUPER_ADMIN']);
      await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, message: 'Cidade deletada' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
