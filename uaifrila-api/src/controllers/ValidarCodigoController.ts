import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CodigoVerificacaoService } from '../services/CodigoVerificacaoService';
export class ValidarCodigoController extends BaseController {
  private service = new CodigoVerificacaoService();
  validarCodigo = async (req: Request, res: Response) => {
    try { const r = await this.service.validar(req.body || {}); return res.json({ success: true, token: r.token, usuario: r.usuario, data: r.data }); }
    catch (e: any) { return this.handleError(res, e); }
  };
}
