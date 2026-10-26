import { Request, Response } from 'express';
import { OperacaoService } from '../services/OperacaoService';

export class OperacaoController {
  private service = new OperacaoService();

  public candidatar = async (req: any, res: Response): Promise<void> => {
    try {
      const result = await this.service.candidatar(req.body.vagaId, req.user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public aceitar = async (req: any, res: Response): Promise<void> => {
    try {
      const result = await this.service.aceitarCandidatura(req.body.candidaturaId, req.user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public historicoChat = async (req: any, res: Response): Promise<void> => {
    try {
      const historico = await this.service.historicoChat(Number(req.params.vagaId));
      res.json({ mensagens: historico });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
