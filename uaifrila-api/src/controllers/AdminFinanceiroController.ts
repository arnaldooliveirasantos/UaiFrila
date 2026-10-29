import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AdminFinanceiroService } from '../services/AdminFinanceiroService';

export class AdminFinanceiroController extends BaseController {
  private service = new AdminFinanceiroService();

  public listarVariaveis = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const variaveis = await this.service.listarVariaveis();
      this.sucessoLista(res, variaveis as any[], 'variaveis');
    });
  };

  public atualizarVariavel = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const variavel = await this.service.atualizarVariavel(req.body);
      this.sucesso(res, { variavel });
    });
  };
}
