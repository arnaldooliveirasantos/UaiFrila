import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { OperacaoService } from '../services/OperacaoService';

export class OperacaoController extends BaseController {
  private service = new OperacaoService();

  public candidatar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const { vaga_id } = req.body;
      const result = await this.service.candidatar(parseInt(vaga_id), usuarioId);
      this.sucesso(res, { candidatura: result });
    });
  };

  public listar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const ops = await this.service.listarOperacoes(usuarioId);
      this.sucessoLista(res, ops as any[], 'operacoes');
    });
  };
}
