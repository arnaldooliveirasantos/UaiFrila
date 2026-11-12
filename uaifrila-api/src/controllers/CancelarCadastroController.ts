import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CodigoVerificacaoService } from '../services/CodigoVerificacaoService';
export class CancelarCadastroController extends BaseController {
  private service = new CodigoVerificacaoService();
  cancelarCadastro = async (req: Request, res: Response) => {
    try { const r = await this.service.cancelar(req.body || {}); return res.json({ success: true, ...r }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
