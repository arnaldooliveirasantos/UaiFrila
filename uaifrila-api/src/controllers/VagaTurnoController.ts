import { Response } from 'express';
import { VagaTurnoService } from '../services/VagaTurnoService';
import { BaseController, AuthRequest } from './BaseController';
export class VagaTurnoController extends BaseController {
  private service: VagaTurnoService;
  constructor() { super(); this.service = new VagaTurnoService(); }
  listarPorVaga = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarPorVaga(Number(req.params.vagaId)); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  resumo = async (req: AuthRequest, res: Response) => { try { const r = await this.service.resumo(Number(req.params.vagaId)); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  substituirAgenda = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.substituirAgenda(Number(req.params.vagaId), Number(req.usuario?.id), req.body?.turnos); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  criar = async (req: AuthRequest, res: Response) => { try { const t = await this.service.criarTurno(Number(req.params.vagaId), Number(req.usuario?.id), req.body); return res.status(201).json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  atualizar = async (req: AuthRequest, res: Response) => { try { const t = await this.service.atualizarTurno(Number(req.params.id), Number(req.usuario?.id), req.body); return res.json({ success: true, data: this.mapToPublic(t, req) }); } catch (e: any) { return this.handleError(res, e); } };
  deletar = async (req: AuthRequest, res: Response) => { try { const ok = await this.service.deletarTurno(Number(req.params.id), Number(req.usuario?.id)); return res.json({ success: true, data: { deletado: ok } }); } catch (e: any) { return this.handleError(res, e); } };
}
