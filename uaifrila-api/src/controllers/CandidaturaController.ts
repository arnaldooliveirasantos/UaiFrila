
import { Response } from 'express';
import { CandidaturaService } from '../services/CandidaturaService';
import { BaseController, AuthRequest } from './BaseController';

export class CandidaturaController extends BaseController {
  private service: CandidaturaService;

  constructor() {
    super();
    this.service = new CandidaturaService();
  }

  listarPorVaga = async (req: AuthRequest, res: Response) => {
    try {
      const candidaturas = await this.service.listarPorVaga(Number(req.params.vagaId));
      return res.json({ success: true, data: this.mapListToPublic(candidaturas, req), candidaturas: this.mapListToPublic(candidaturas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  minhasCandidaturas = async (req: AuthRequest, res: Response) => {
    try {
      const candidaturas = await this.service.minhasCandidaturas(req.usuario!.id);
      return res.json({ success: true, data: this.mapListToPublic(candidaturas, req), candidaturas: this.mapListToPublic(candidaturas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  candidatar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['FREELA', 'DUAL', 'ADMIN', 'SUPER_ADMIN']);
      const candidatura = await this.service.candidatar({
        vagaId: Number(req.params.vagaId || req.body.vagaId),
        usuarioId: req.usuario!.id,
        mensagem: req.body.mensagem
      });
      return res.status(201).json({ success: true, data: this.mapToPublic(candidatura, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizarStatus = async (req: AuthRequest, res: Response) => {
    try {
      const candidatura = await this.service.atualizarStatus(Number(req.params.id), req.body.status);
      return res.json({ success: true, data: candidatura ? this.mapToPublic(candidatura, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, message: 'Candidatura removida' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
