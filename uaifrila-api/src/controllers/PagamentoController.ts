import { Response } from 'express';
import { PagamentoService } from '../services/PagamentoService';
import { BaseController, AuthRequest } from './BaseController';
export class PagamentoController extends BaseController {
  private service = new PagamentoService();
  criar = async (req: AuthRequest, res: Response) => {
    try {
      const p = await this.service.criarOuObter(Number(req.body?.candidatura_id ?? req.body?.candidaturaId), Number(req.usuario!.id), req.body?.metodo || 'pix', req.body?.token_cartao, Number(req.body?.parcelas || 1));
      return res.status(201).json({ success: true, data: p, pagamento: p });
    } catch (e: any) { return this.handleError(res, e); }
  };
  buscarPorCandidatura = async (req: AuthRequest, res: Response) => {
    try {
      const p = await this.service.buscarPorCandidatura(Number(req.params.candidaturaId), Number(req.usuario!.id), this.isAdmin(req));
      return res.json({ success: true, data: p, pagamento: p });
    } catch (e: any) { return this.handleError(res, e); }
  };
  meus = async (req: AuthRequest, res: Response) => {
    try {
      const lista = await this.service.listarPorContratante(Number(req.usuario!.id), this.isAdmin(req));
      return res.json({ success: true, data: lista, pagamentos: lista });
    } catch (e: any) { return this.handleError(res, e); }
  };
  reembolsar = async (req: AuthRequest, res: Response) => {
    try {
      const r = await this.service.reembolsar(Number(req.params.id), Number(req.usuario!.id), req.body?.motivo || 'Cancelado', this.isAdmin(req));
      return res.json({ success: true, data: r });
    } catch (e: any) { return this.handleError(res, e); }
  };
  // Webhook PÚBLICO (sem authMiddleware): assinatura HMAC validada no service.
  webhook = async (req: AuthRequest, res: Response) => {
    try {
      const corpoBruto = (req as any).rawBody || JSON.stringify(req.body || {});
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = String(v);
      const r = await this.service.processarWebhook(String(req.params.provedor || ''), headers, req.body, corpoBruto);
      return res.json({ success: true, data: r });
    } catch (e: any) { return this.handleError(res, e); }
  };
  processarJobs = async (req: AuthRequest, res: Response) => {
    try {
      if (req.headers['x-worker-secret'] !== (process.env.WORKER_SECRET || '')) return this.error(res, 'Não autorizado', 401);
      const r = await this.service.processarJobs();
      return res.json({ success: true, data: r });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
