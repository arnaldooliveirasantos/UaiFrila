import { Response } from 'express';
import { MensagemService } from '../services/MensagemService';
import { BaseController, AuthRequest } from './BaseController';
export class MensagemController extends BaseController {
  private service = new MensagemService();
  listarPorConversa = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorConversa(Number(req.params.conversaId), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  enviar = async (req: AuthRequest, res: Response) => { try { const m = await this.service.enviar(Number(req.params.conversaId), Number(req.usuario?.id), req.body); return res.status(201).json({ success: true, data: this.mapToPublic(m, req) }); } catch (e: any) { return this.handleError(res, e); } };
  marcarComoLida = async (req: AuthRequest, res: Response) => { try { await this.service.marcarComoLida(Number(req.params.conversaId), Number(req.usuario?.id)); return res.json({ success: true }); } catch (e: any) { return this.handleError(res, e); } };
}
