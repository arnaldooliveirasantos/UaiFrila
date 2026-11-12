import { Response } from 'express';
import { GanhosService } from '../services/GanhosService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers: fino, delega para o service. Sem pool.query, sem SQL.
// A rota GET /api/ganhos/meus NAO existia no App.ts (o front MeusGanhos chamava e caia em 404).
// Veja o patch do App.ts nesta entrega.
export class GanhosController extends BaseController {
  private service = new GanhosService();
  meusGanhos = async (req: AuthRequest, res: Response) => {
    try {
      const r = await this.service.meusGanhos(Number(req.usuario!.id), req.query || {});
      return res.json({ success: true, data: r.ganhos, ganhos: r.ganhos, resumo: r.resumo, comissao_percentual: r.comissao_percentual });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
