import { Response } from 'express';
import { VagaTemplateService } from '../services/VagaTemplateService';
import { BaseController, AuthRequest } from './BaseController';

export class VagaTemplateController extends BaseController {
  private service = new VagaTemplateService();
  listar = async (req: AuthRequest, res: Response) => { try { const lista = await this.service.listar(); return res.json({ success: true, data: lista }); } catch (e: any) { return this.handleError(res, e); } };
}
