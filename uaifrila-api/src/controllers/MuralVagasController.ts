
import { Request, Response } from 'express';
import { MuralVagasService } from '../services/MuralVagasService';

export class MuralVagasController {
  private muralService: MuralVagasService;
  private service: MuralVagasService;
  constructor() { 
    this.muralService = new MuralVagasService();
    this.service = this.muralService;
  }

  obterMural = async (req: Request, res: Response) => {
    try {
      const usuario = (req as any).usuario;
      const { tipo, usuarioId, page, limit } = { ...req.query, ...req.body } as any;
      const idParaBusca = usuarioId ? Number(usuarioId) : usuario?.id;
      const p = Number(page || (req.query as any).page || 1);
      const l = Number(limit || (req.query as any).limit || 20);
      
      const svc = this.muralService as any;
      let dados;
      if (svc.listarVagasParaMural) {
        dados = await svc.listarVagasParaMural(idParaBusca, tipo || 'FREELA');
      } else if (svc.obterMural) {
        dados = await svc.obterMural(idParaBusca, p, l);
      } else {
        dados = [];
      }
      
      res.json({ sucesso: true, vagas: dados, mural: dados });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  listarVagasParaMural = async (req: Request, res: Response) => {
    return await this.obterMural(req, res);
  };
}
