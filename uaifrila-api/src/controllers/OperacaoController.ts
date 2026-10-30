
import { Request, Response } from 'express';
import { OperacaoService } from '../services/OperacaoService';

export class OperacaoController {
  private service: OperacaoService;
  constructor() { this.service = new OperacaoService(); }
  candidatar = async (req: Request, res: Response) => {
    try {
      const vaga_id = req.params.vaga_id || req.params.id || req.body.vaga_id;
      const usuarioId = (req as any).usuario?.id || req.body.usuario_id;
      const result = await (this.service as any).candidatar({ vagaId: parseInt(vaga_id), usuarioId });
      res.json({ sucesso:true, candidatura: result });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };
}
