
import { Request, Response } from 'express';
import { TransacaoService } from '../services/TransacaoService';

export class TransacaoController {
  private service: TransacaoService;

  constructor() {
    this.service = new TransacaoService();
  }

  listar = async (req: Request, res: Response) => {
    try {
      const usuario = (req as any).usuario;
      const transacoes = await this.service.listarPorUsuario(usuario.id, usuario.nivel_permissao || 0);
      res.json({ sucesso: true, transacoes });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
