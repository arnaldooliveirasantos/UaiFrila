import { Response } from 'express';
import { StatusVagaService } from '../services/StatusVagaService';
import { BaseController, AuthRequest } from './BaseController';

export class StatusVagaController extends BaseController {
  private service: StatusVagaService;
  constructor() { super(); this.service = new StatusVagaService(); }
  listar = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  listarAtivos = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listarAtivos(); return res.json({ success: true, data: this.mapListToPublic(lista, req) }); } catch (e: any) { return this.handleError(res, e); } };
  buscarPorId = async (req: AuthRequest, res: Response) => { try { const s = await this.service.buscarPorId(Number(req.params.id)); return res.json({ success: true, data: this.mapToPublic(s, req) }); } catch (e: any) { return this.handleError(res, e); } };
  buscarPorChave = async (req: AuthRequest, res: Response) => { try { const s = await this.service.buscarPorChave(req.params.chave); return res.json({ success: true, data: this.mapToPublic(s, req) }); } catch (e: any) { return this.handleError(res, e); } };
  criar = async (req: AuthRequest, res: Response) => { try { this.checkRole(req, ['ADMIN','SUPER_ADMIN']); const s = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(s, req) }); } catch (e: any) { return this.handleError(res, e); } };
  atualizar = async (req: AuthRequest, res: Response) => { try { this.checkRole(req, ['ADMIN','SUPER_ADMIN']); const s = await this.service.atualizar(Number(req.params.id), req.body); return res.json({ success: true, data: this.mapToPublic(s, req) }); } catch (e: any) { return this.handleError(res, e); } };
}
