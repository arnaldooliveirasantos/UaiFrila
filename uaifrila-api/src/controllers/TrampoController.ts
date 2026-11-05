
import { Response } from 'express';
import { TrampoService } from '../services/TrampoService';
import { BaseController, AuthRequest } from './BaseController';

export class TrampoController extends BaseController {
  private service: TrampoService;

  constructor() {
    super();
    this.service = new TrampoService();
  }

  meusTrampos = async (req: AuthRequest, res: Response) => {
    try {
      const trampos = await this.service.meusTrampos(req.usuario!.id);
      return res.json({ success: true, data: this.mapListToPublic(trampos, req), trampos: this.mapListToPublic(trampos, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const trampo = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(trampo, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  iniciar = async (req: AuthRequest, res: Response) => {
    try {
      const trampo = await this.service.iniciar(Number(req.params.id));
      return res.json({ success: true, data: trampo ? this.mapToPublic(trampo, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  finalizar = async (req: AuthRequest, res: Response) => {
    try {
      const trampo = await this.service.finalizar(Number(req.params.id));
      return res.json({ success: true, data: trampo ? this.mapToPublic(trampo, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const trampo = await this.service.atualizar(Number(req.params.id), req.body);
      return res.json({ success: true, data: trampo ? this.mapToPublic(trampo, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
