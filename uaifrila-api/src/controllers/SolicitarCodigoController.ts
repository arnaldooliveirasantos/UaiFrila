import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CodigoVerificacaoService } from '../services/CodigoVerificacaoService';
// Controller fino: so valida o formato da resposta e delega para o service. Sem pool, sem SQL, sem BEGIN/COMMIT.
export class SolicitarCodigoController extends BaseController {
  private service = new CodigoVerificacaoService();
  solicitarCodigo = async (req: Request, res: Response) => {
    try { const r = await this.service.solicitar(req.body || {}); return res.json({ success: true, message: r.message, usuario_id: r.usuario_id, usuario_existente: r.usuario_existente }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  reenviarCodigo = this.solicitarCodigo;
}
