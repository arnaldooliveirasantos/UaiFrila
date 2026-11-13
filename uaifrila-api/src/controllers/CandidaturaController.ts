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
  // Aliases: o App.ts roteia estes nomes. Sem eles, POST /api/candidaturas
  // (Candidatar-se) e DELETE /api/candidaturas/:id (Cancelar candidatura)
  // davam 500 ("candidatar is not a function") e os botoes do Mural nao funcionavam.
  candidatar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.candidatar(req.body, Number(req.usuario?.id)); return res.status(201).json({ success: true, data: this.mapToPublic(r, req) }); } catch (e: any) { return this.handleError(res, e); } };
  deletar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.cancelar(Number(req.params.id), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  minhasCandidaturas = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarMinhas(Number(req.usuario?.id)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  listarPorVaga = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorVaga(Number(req.params.vagaId)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  // PUT /api/candidaturas/:id/status { status } - fonte unica de troca de status.
  // CANCELADA -> service.cancelar (reutiliza regra de prazo/motivo). ACEITA -> service.aceitar.
  atualizarStatus = async (req: AuthRequest, res: Response) => { try { const status = String(req.body?.status || '').toUpperCase(); const id = Number(req.params.id); const usuarioId = Number(req.usuario?.id); let out: any; if (status === 'CANCELADA') out = await this.service.cancelar(id, usuarioId, req.body?.motivo); else if (status === 'ACEITA') out = await this.service.aceitar(id, usuarioId); else return this.error(res, 'Status invalido. Use ACEITA ou CANCELADA', 400); return res.json({ success: true, data: out }); } catch (e: any) { return this.handleError(res, e); } };
  listarTodas = async (req: AuthRequest, res: Response) => { try { this.checkRole(req, ['ADMIN', 'SUPER_ADMIN', 'FINANCEIRO']); const lista = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
