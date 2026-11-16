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
  atualizarStatus = async (req: AuthRequest, res: Response) => { try { const status = String(req.body?.status || '').toUpperCase(); const id = Number(req.params.id); const usuarioId = Number(req.usuario?.id); let out: any; if (status === 'CANCELADA') out = await this.service.cancelar(id, usuarioId, req.body?.motivo); else if (status === 'ACEITA') out = await this.service.aceitar(id, usuarioId); else if (status === 'RECUSADA') out = await this.service.recusar(id, usuarioId, req.body?.motivo); else return this.error(res, 'Status invalido. Use ACEITA, RECUSADA ou CANCELADA', 400); return res.json({ success: true, data: out }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: seleção em lote — POST /api/candidaturas/vaga/:vagaId/selecionar { candidatura_ids: [] }
  selecionarEmLote = async (req: AuthRequest, res: Response) => { try { const r = await this.service.selecionarEmLote(Number(req.params.vagaId), Number(req.usuario?.id), req.body?.candidatura_ids || req.body?.ids || []); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: freela confirma / recusa a seleção.
  confirmarSelecao = async (req: AuthRequest, res: Response) => { try { const r = await this.service.confirmarSelecao(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  recusarSelecao = async (req: AuthRequest, res: Response) => { try { const r = await this.service.recusarSelecao(Number(req.params.id), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: dono recusa uma candidatura (PENDENTE / LISTA_ESPERA / SELECIONADO).
  recusar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.recusar(Number(req.params.id), Number(req.usuario?.id), req.body?.motivo); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: dono marca candidatura como vista.
  marcarVisto = async (req: AuthRequest, res: Response) => { try { const r = await this.service.marcarVisto(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: resumo da seleção da vaga (quantidade, preenchidas, restantes, fila).
  resumoSelecao = async (req: AuthRequest, res: Response) => { try { const r = await this.service.resumoSelecao(Number(req.params.vagaId), Number(req.usuario?.id)); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  // Fase 1: expira seleções com prazo vencido (cron). Chamada preguiçosa nas listagens também.
  processarPrazos = async (req: AuthRequest, res: Response) => { try { const r = await this.service.processarPrazos(); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  listarTodas = async (req: AuthRequest, res: Response) => { try { this.checkRole(req, ['ADMIN', 'SUPER_ADMIN', 'FINANCEIRO']); const lista = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
