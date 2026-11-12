import { Response } from 'express';
import { CandidatoService } from '../services/CandidatoService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers: fino, delega para o service. Sem Client pg, sem SQL, sem mock.
export class CandidatoController extends BaseController {
  private service: CandidatoService;
  constructor() { super(); this.service = new CandidatoService(); }
  listarCandidatosPorVaga = async (req: AuthRequest, res: Response) => {
    try {
      const candidatos = await this.service.listarCandidatosPorVaga(Number(req.params.vagaId));
      return res.json({ success: true, data: candidatos, candidatos });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
