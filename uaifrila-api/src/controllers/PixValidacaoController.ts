import { Response } from 'express';
import { PixValidacaoService } from '../services/PixValidacaoService';
import { BaseController, AuthRequest } from './BaseController';
// Confirmação por e-mail do Pix de terceiro (token 6 dígitos).
export class PixValidacaoController extends BaseController {
  private service = new PixValidacaoService();
  confirmar = async (req: AuthRequest, res: Response) => {
    try {
      const v = await this.service.confirmarValidacao(Number(req.usuario!.id), String(req.body?.token || req.body?.codigo || ''));
      return res.json({ success: true, data: v, message: 'Pix de terceiro confirmado. Salve os dados Pix de novo para concluir.' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
