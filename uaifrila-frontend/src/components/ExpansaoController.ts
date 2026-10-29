
import { Request, Response } from 'express';
import { ExpansaoRepository } from '../repositories/ExpansaoRepository';

export class ExpansaoController {
  static async listarCidades(req: Request, res: Response) {
    try {
      const cidades = await ExpansaoRepository.listarCidades();
      return res.json({ cidades });
    } catch (e: any) {
      return res.status(500).json({ erro: e.message });
    }
  }

  static async listar(req: Request, res: Response) {
    try {
      const solicitacoes = await ExpansaoRepository.listarSolicitacoes();
      const cidades = await ExpansaoRepository.listarCidades();
      return res.json({ solicitacoes, cidades, expansao: solicitacoes });
    } catch (e: any) {
      return res.status(500).json({ erro: e.message });
    }
  }

  static async solicitar(req: Request, res: Response) {
    try {
      const { cidade_nome, estado_sigla, motivo } = req.body;
      const usuarioId = (req as any).usuario?.id;
      if (!cidade_nome) return res.status(400).json({ erro: 'cidade_nome obrigatório' });
      if (!estado_sigla) return res.status(400).json({ erro: 'estado_sigla obrigatório' });

      const nova = await ExpansaoRepository.solicitar(cidade_nome, estado_sigla, motivo, usuarioId);
      return res.status(201).json({ sucesso: true, solicitacao: nova });
    } catch (e: any) {
      console.error('Erro solicitar expansao:', e);
      return res.status(400).json({ erro: e.message });
    }
  }
}
