import { Response } from 'express';
import { RepasseService } from '../services/RepasseService';
import { BaseController, AuthRequest } from './BaseController';
// Repasses: endpoint interno do worker (X-Worker-Secret).
export class RepasseController extends BaseController {
  private service = new RepasseService();
  processarJobs = async (req: AuthRequest, res: Response) => {
    try {
      if (req.headers['x-worker-secret'] !== (process.env.WORKER_SECRET || '')) return this.error(res, 'Não autorizado', 401);
      const r = await this.service.processarVencidos();
      return res.json({ success: true, data: r });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
