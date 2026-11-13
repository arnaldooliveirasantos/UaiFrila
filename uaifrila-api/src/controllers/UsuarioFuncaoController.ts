import { Response } from 'express';
import { UsuarioFuncaoService } from '../services/UsuarioFuncaoService';
import { BaseController, AuthRequest } from './BaseController';
export class UsuarioFuncaoController extends BaseController {
  private service = new UsuarioFuncaoService();
  minhas = async (req: AuthRequest, res: Response) => { try { const l = await this.service.listarMinhas(req.usuario!.id); return res.json({ success: true, data: l }); } catch (e: any) { return this.handleError(res, e); } };
  salvar = async (req: AuthRequest, res: Response) => { try { const r = await this.service.salvar(req.usuario!.id, req.body || {}); return res.json({ success: true, data: r }); } catch (e: any) { return this.handleError(res, e); } };
  remover = async (req: AuthRequest, res: Response) => { try { const ok = await this.service.remover(req.usuario!.id, Number(req.params.funcaoId)); return res.json({ success: true, data: ok }); } catch (e: any) { return this.handleError(res, e); } };
}
