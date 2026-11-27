import { Response } from 'express';
import { CategoriaFuncaoService } from '../services/CategoriaFuncaoService';
import { BaseController, AuthRequest } from './BaseController';
export class CategoriaFuncaoController extends BaseController {
  private service = new CategoriaFuncaoService();
  listar = async (_req: AuthRequest, res: Response) => { try { const l = await this.service.listarAtivas(); return res.json({ success: true, data: this.mapListToPublic(l, _req) }); } catch (e: any) { return this.handleError(res, e); } };
  listarComFuncoes = async (_req: AuthRequest, res: Response) => { try { const l = await this.service.listarComFuncoes(); return res.json({ success: true, data: l }); } catch (e: any) { return this.handleError(res, e); } };
}
