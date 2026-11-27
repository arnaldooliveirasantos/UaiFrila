import { Response } from 'express';
import { ConversaService } from '../services/ConversaService';
import { BaseController, AuthRequest } from './BaseController';
export class ConversaController extends BaseController {
  private service = new ConversaService();
  listarMinhas = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorUsuario(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  buscarOuCriar = async (req: AuthRequest, res: Response) => { try { const { trampo_id, contratante_id, freela_id } = req.body; const c = await this.service.buscarOuCriarPorTrampo(Number(trampo_id), Number(contratante_id), Number(freela_id)); return res.status(201).json({ success: true, data: this.mapToPublic(c, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
