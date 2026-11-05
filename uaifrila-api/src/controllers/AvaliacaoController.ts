
import { Response } from 'express';
import { AvaliacaoService } from '../services/AvaliacaoService';
import { BaseController, AuthRequest } from './BaseController';

export class AvaliacaoController extends BaseController {
  private service: AvaliacaoService;

  constructor() {
    super();
    this.service = new AvaliacaoService();
  }

  minhasAvaliacoes = async (req: AuthRequest, res: Response) => {
    try {
      const avaliacoes = await this.service.minhasAvaliacoes(req.usuario!.id);
      return res.json({ success: true, data: this.mapListToPublic(avaliacoes, req), avaliacoes: this.mapListToPublic(avaliacoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorAvaliado = async (req: AuthRequest, res: Response) => {
    try {
      const avaliacoes = await this.service.listarPorAvaliado(Number(req.params.avaliadoId));
      return res.json({ success: true, data: this.mapListToPublic(avaliacoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      const avaliacao = await this.service.criarAvaliacao({
        avaliadorId: req.usuario!.id,
        avaliadoId: Number(req.body.avaliadoId),
        nota: Number(req.body.nota),
        comentario: req.body.comentario,
        trampoId: req.body.trampoId ? Number(req.body.trampoId) : undefined
      });
      return res.status(201).json({ success: true, data: this.mapToPublic(avaliacao, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const avaliacao = await this.service.atualizar(Number(req.params.id), req.body);
      return res.json({ success: true, data: avaliacao ? this.mapToPublic(avaliacao, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, message: 'Avaliação deletada' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
