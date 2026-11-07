import { Response } from 'express';
import { CandidaturaService } from '../services/CandidaturaService';
import { BaseController, AuthRequest } from './BaseController';

export class CandidaturaController extends BaseController {
  private service: CandidaturaService;
  constructor() { super(); this.service = new CandidaturaService(); }
  criar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.criar(req.body, Number(req.usuario?.id)); return res.status(201).json({ success: true, data: this.mapToPublic(r, req) }); } catch (e: any) { return this.handleError(res, e); } };
  aceitar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.aceitar(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(r, req) }); } catch (e: any) { return this.handleError(res, e); } };
  cancelar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.cancelar(Number(req.params.id), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  cancelarPorVaga = async (req: AuthRequest, res: Response) => { try { const r = await this.service.cancelarPorVaga(Number(req.params.vagaId), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  listarMinhas = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarMinhas(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
