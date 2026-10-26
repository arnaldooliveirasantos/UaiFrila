import { Request, Response } from 'express';
import { AdminFinanceiroService } from '../services/AdminFinanceiroService';

export class AdminFinanceiroController {
  private service = new AdminFinanceiroService();

  public obterVariaveis = async (req: any, res: Response): Promise<void> => {
    try {
      const vars = await this.service.listarVariaveis();
      res.json({ variaveis: vars });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public salvarVariavel = async (req: any, res: Response): Promise<void> => {
    try {
      const result = await this.service.salvarVariavel(req.body);
      res.json({ sucesso: true, variavel: result });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public relatorioTransacoes = async (req: any, res: Response): Promise<void> => {
    try {
      const rel = await this.service.relatorioTransacoes(req.query);
      res.json(rel);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
