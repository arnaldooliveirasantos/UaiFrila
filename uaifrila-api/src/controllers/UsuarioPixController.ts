import { Response } from 'express';
import { UsuarioPixService } from '../services/UsuarioPixService';
import { BaseController, AuthRequest } from './BaseController';

// Dados PIX do usuario logado - para receber os trampos realizados.
// Controller SO faz HTTP (req/res) e delega para o Service.
// Sem SQL, sem pool, sem validacao aqui: validacao esta no Service, SQL no Repository.
export class UsuarioPixController extends BaseController {
  private service: UsuarioPixService;

  constructor() {
    super();
    this.service = new UsuarioPixService();
  }

  buscarMeu = async (req: AuthRequest, res: Response) => {
    try {
      const pix = await this.service.buscarMeuPix(req.usuario!.id);
      return res.json({ success: true, data: pix ? this.mapToPublic(pix, req) : null, pix: pix ? this.mapToPublic(pix, req) : null });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarHistorico = async (req: AuthRequest, res: Response) => {
    try {
      const lista = await this.service.listarHistorico(req.usuario!.id);
      return res.json({ success: true, data: this.mapListToPublic(lista, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  salvar = async (req: AuthRequest, res: Response) => {
    try {
      const pix = await this.service.salvarPix(req.usuario!.id, req.body || {});
      const pub = this.mapToPublic(pix, req);
      return res.json({ success: true, data: pub, pix: pub, message: 'Dados PIX salvos' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  excluir = async (req: AuthRequest, res: Response) => {
    try {
      await this.service.excluirPix(req.usuario!.id);
      return res.json({ success: true, message: 'Dados PIX removidos' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
