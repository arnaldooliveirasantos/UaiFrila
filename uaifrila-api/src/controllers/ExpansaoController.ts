import { Request, Response } from 'express';
import { ExpansaoRepository } from '../repositories/ExpansaoRepository';

export class ExpansaoController {
  private repo = new ExpansaoRepository();

  private async validarAcesso(req: any): Promise<boolean> {
    const user = req.user;
    if (!user) return false;
    return user.is_admin || user.is_super_admin || ['super_admin','admin'].includes(user.role);
  }

  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcesso(req as any)) {
        res.status(403).json({ erro: 'Acesso negado: apenas admin' });
        return;
      }

      const { status, prioridade, search } = req.query as any;
      const expansoes = await this.repo.listarExpansao({
        status: status as string,
        prioridade: prioridade !== undefined ? parseInt(prioridade) : undefined,
        search: search as string
      });

      const estatisticas = await this.repo.obterEstatisticas();

      res.status(200).json({ sucesso: true, expansoes, estatisticas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public hierarquia = async (req: Request, res: Response): Promise<void> => {
    try {
      const hierarquia = await this.repo.listarCidadesHierarquia();
      res.status(200).json({ sucesso: true, hierarquia });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public bairros = async (req: Request, res: Response): Promise<void> => {
    try {
      const cidadeId = parseInt(req.params.cidadeId);
      const bairros = await this.repo.listarBairros(cidadeId);
      res.status(200).json({ sucesso: true, bairros });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public solicitar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }

      const { cidade_nome, estado_sigla, populacao, motivo } = req.body;
      if (!cidade_nome || !estado_sigla) {
        res.status(400).json({ erro: 'cidade_nome e estado_sigla obrigatórios' });
        return;
      }

      const result = await this.repo.criarSolicitacao({
        cidade_nome,
        estado_sigla,
        populacao,
        motivo,
        solicitado_por: userId
      });

      res.status(201).json({ sucesso: true, expansao: result[0] });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public atualizarStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcesso(req as any)) {
        res.status(403).json({ erro: 'Acesso negado: apenas admin' });
        return;
      }

      const id = parseInt(req.params.id);
      const { status, motivo } = req.body;
      const userId = (req as any).user?.id;

      if (!status) {
        res.status(400).json({ erro: 'Status obrigatório' });
        return;
      }

      const result = await this.repo.atualizarStatus(id, status, userId, motivo);

      res.status(200).json({ sucesso: true, expansao: result[0] });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public estatisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcesso(req as any)) {
        res.status(403).json({ erro: 'Acesso negado' });
        return;
      }

      const stats = await this.repo.obterEstatisticas();
      res.status(200).json({ sucesso: true, ...stats });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
