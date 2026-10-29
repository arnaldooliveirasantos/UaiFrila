
import { Request, Response } from 'express';
import { ExpansaoService } from '../services/ExpansaoService';

export class ExpansaoController {
  private service: ExpansaoService;

  constructor() {
    this.service = new ExpansaoService();
  }

  listarCidades = async (req: Request, res: Response) => {
    try {
      const cidades = await this.service.listarCidades();
      res.json({ sucesso: true, cidades });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  listarCidadesAtivas = async (req: Request, res: Response) => {
    try {
      const cidades = await this.service.listarCidadesAtivas();
      res.json({ sucesso: true, cidades });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  listar = async (req: Request, res: Response) => {
    try {
      const data = await this.service.listarCompleto();
      res.json({ sucesso: true, ...data });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  solicitar = async (req: Request, res: Response) => {
    try {
      const { cidade_nome, estado_sigla, motivo } = req.body;
      const usuarioId = (req as any).usuario?.id;
      const result = await this.service.solicitar(cidade_nome, estado_sigla, motivo, usuarioId);
      res.status(201).json({ sucesso: true, solicitacao: result });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };
}
