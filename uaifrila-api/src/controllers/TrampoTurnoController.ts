import { Response } from 'express';
import { TrampoTurnoService } from '../services/TrampoTurnoService';
import { BaseController, AuthRequest } from './BaseController';
export class TrampoTurnoController extends BaseController {
  private service: TrampoTurnoService;
  constructor() { super(); this.service = new TrampoTurnoService(); }
  listarPorTrampo = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorTrampo(Number(req.params.trampoId), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  gerar = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.gerarParaTrampo(Number(req.params.trampoId), Number(req.usuario?.id)); return res.status(201).json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  resumo = async (req: AuthRequest, res: Response) => { try { const r = await this.service.resumoPagamento(Number(req.params.trampoId), Number(req.usuario?.id)); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  checkin = async (req: AuthRequest, res: Response) => { try { const t = await this.service.checkin(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  checkout = async (req: AuthRequest, res: Response) => { try { const t = await this.service.checkout(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  confirmar = async (req: AuthRequest, res: Response) => { try { const t = await this.service.confirmarTurno(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  falta = async (req: AuthRequest, res: Response) => { try { const t = await this.service.marcarFalta(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  cancelarRestantes = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.cancelarRestantes(Number(req.params.trampoId), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
