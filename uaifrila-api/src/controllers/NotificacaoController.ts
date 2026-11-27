import { Response } from 'express';
import { NotificacaoService } from '../services/NotificacaoService';
import { BaseController, AuthRequest } from './BaseController';

export class NotificacaoController extends BaseController {
  private service: NotificacaoService;
  constructor() { super(); this.service = new NotificacaoService(); }
  listarMinhas = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorUsuario(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  marcarComoLida = async (req: AuthRequest, res: Response) => { try { const n = await this.service.marcarComoLida(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(n, req) }); } catch (e: any) { return this.handleError(res, e); } };
  contarNaoLidas = async (req: AuthRequest, res: Response) => { try { const n = await this.service.contarNaoLidas(Number(req.usuario?.id)); return res.json({ success: true, data: { nao_lidas: n } }); } catch (e: any) { return this.handleError(res, e); } };
  marcarTodasComoLidas = async (req: AuthRequest, res: Response) => { try { const n = await this.service.marcarTodasComoLidas(Number(req.usuario?.id)); return res.json({ success: true, data: { marcadas: n } }); } catch (e: any) { return this.handleError(res, e); } };
}
