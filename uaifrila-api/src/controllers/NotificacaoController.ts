import { Response } from 'express';
import { NotificacaoService } from '../services/NotificacaoService';
import { BaseController, AuthRequest } from './BaseController';

export class NotificacaoController extends BaseController {
  private service: NotificacaoService;
  constructor() { super(); this.service = new NotificacaoService(); }
  listarMinhas = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorUsuario(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  marcarComoLida = async (req: AuthRequest, res: Response) => { try { const n = await this.service.marcarComoLida(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(n, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
