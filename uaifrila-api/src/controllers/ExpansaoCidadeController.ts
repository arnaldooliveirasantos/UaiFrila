import { Response } from 'express';
import { ExpansaoCidadeService } from '../services/ExpansaoCidadeService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers: fino, delega para o service. Sem pool.query.
// Mesmos endpoints de antes + deletar (que o App ja chamava, mas nao existia).
export class ExpansaoCidadeController extends BaseController {
  private service: ExpansaoCidadeService;
  constructor() { super(); this.service = new ExpansaoCidadeService(); }
  solicitar = async (req: AuthRequest, res: Response) => {
    try {
      const { cidade_nome, cidadeNome, estado_sigla, estadoSigla, pais_sigla, paisSigla } = req.body || {};
      const r = await this.service.solicitar({
        cidadeNome: cidade_nome || cidadeNome, estadoSigla: estado_sigla || estadoSigla,
        paisSigla: pais_sigla || paisSigla || 'BRA', solicitadoPor: Number(req.usuario!.id),
      });
      return res.status(201).json({ success: true, data: this.mapToPublic(r, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
  listar = async (req: AuthRequest, res: Response) => {
    try { const itens = await this.service.listar(); return res.json({ success: true, data: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  listarPorStatus = async (req: AuthRequest, res: Response) => {
    try { const itens = await this.service.listarPorStatus(req.params.status); return res.json({ success: true, data: this.mapListToPublic(itens, req) }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  dashboard = async (req: AuthRequest, res: Response) => {
    try { const d = await this.service.dashboard(); return res.json({ success: true, data: d }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  atualizarStatus = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const r = await this.service.atualizarStatus(Number(req.params.id), req.body?.status);
      return res.json({ success: true, data: r ? this.mapToPublic(r, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };
  deletar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const ok = await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, data: ok });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
