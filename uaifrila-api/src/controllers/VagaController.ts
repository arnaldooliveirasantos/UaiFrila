import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private vagaService = new VagaService();

  public criar = async (req: any, res: Response): Promise<void> => {
    try {
      const contratanteId = req.user?.id || req.body.contratante_id;
      if (!contratanteId) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }
      const vaga = await this.vagaService.criar({
        contratante_id: contratanteId,
        ...req.body
      });
      res.status(201).json({ sucesso: true, vaga });
    } catch (e: any) {
      console.error('Erro criar vaga:', e);
      res.status(500).json({ erro: e.message });
    }
  };

  public criarVaga = async (req: any, res: Response): Promise<void> => {
    return this.criar(req, res);
  };

  public listar = async (req: any, res: Response): Promise<void> => {
    try {
      const vagas = await this.vagaService.listar(req.query);
      res.json({ vagas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
