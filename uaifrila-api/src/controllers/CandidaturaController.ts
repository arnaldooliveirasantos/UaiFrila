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
  // Aliases que o App.ts ja chamava, mas nao existiam no controller (500).
  minhasCandidaturas = async (req: AuthRequest, res: Response) => {
    try { const lista = await this.service.listarMinhas(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarPorVaga = async (req: AuthRequest, res: Response) => {
    try { const lista = await this.service.listarPorVaga(Number(req.params.vagaId)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarTodas = async (req: AuthRequest, res: Response) => {
    try { const lista = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  candidatar = async (req: AuthRequest, res: Response) => {
    try { const r = await this.service.candidatar(req.body, Number(req.usuario?.id)); return res.status(201).json({ success: true, data: this.mapToPublic(r, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  // PUT /api/candidaturas/:id/status { status: 'ACEITA' | 'CANCELADA', motivo? }
  atualizarStatus = async (req: AuthRequest, res: Response) => {
    try {
      const status = String(req.body?.status || '').toUpperCase();
      const id = Number(req.params.id);
      if (status === 'ACEITA') { const r = await this.service.aceitar(id, Number(req.usuario?.id)); return res.json({ success: true, data: this.mapToPublic(r, req) }); }
      if (status === 'CANCELADA' || status === 'CANCELAR') { const r = await this.service.cancelar(id, Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); }
      return this.error(res, `Status invalido: ${status}. Use ACEITA ou CANCELADA`, 400);
    } catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: AuthRequest, res: Response) => {
    try { const r = await this.service.cancelar(Number(req.params.id), Number(req.usuario?.id), 'Excluido'); return res.json({ success: true, data: r }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
