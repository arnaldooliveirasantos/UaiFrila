
import { Response } from 'express';
import { TransacaoService } from '../services/TransacaoService';
import { BaseController, AuthRequest } from './BaseController';

export class TransacaoController extends BaseController {
  private service: TransacaoService;

  constructor() {
    super();
    this.service = new TransacaoService();
  }

  minhasTransacoes = async (req: AuthRequest, res: Response) => {
    try {
      const transacoes = await this.service.minhasTransacoes(req.usuario!.id);
      return res.json({ success: true, data: this.mapListToPublic(transacoes, req), transacoes: this.mapListToPublic(transacoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorUsuario = async (req: AuthRequest, res: Response) => {
    try {
      const usuarioId = Number(req.params.usuarioId || req.usuario!.id);
      if (usuarioId !== req.usuario!.id && !this.isAdmin(req)) return this.error(res, 'Acesso negado', 403);
      const transacoes = await this.service.listarPorUsuario(usuarioId);
      return res.json({ success: true, data: this.mapListToPublic(transacoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const transacao = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(transacao, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizarStatus = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN', 'FINANCEIRO']);
      const transacao = await this.service.atualizarStatus(Number(req.params.id), req.body.status);
      return res.json({ success: true, data: transacao ? this.mapToPublic(transacao, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarTodas = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN', 'FINANCEIRO']);
      const transacoes = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(transacoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  // Alias que o App ja chamava, mas nao existia (500).
  criar = async (req: AuthRequest, res: Response) => {
    try { const r = await this.service.criar(req.body); return res.status(201).json({ success: true, data: this.mapToPublic(r, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
