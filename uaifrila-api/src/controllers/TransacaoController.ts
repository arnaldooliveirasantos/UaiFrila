import { Request, Response } from 'express';
import { TransacaoRepository } from '../repositories/TransacaoRepository';

export class TransacaoController {
  private repo = new TransacaoRepository();

  private async validarAcessoAdmin(req: any): Promise<boolean> {
    const user = req.user || req.usuario;
    if (!user) return false;
    const nivel = user.nivel_permissao || 0;
    const chave = (user.tipo_chave || user.role || '').toUpperCase();
    return nivel >= 50 || ['FINANCEIRO','ADMIN','SUPER_ADMIN','MODERADOR'].includes(chave);
  }

  // GET /api/transacoes - relatorio (admin/financeiro)
  public relatorio = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcessoAdmin(req as any)) {
        res.status(403).json({ erro: 'Acesso negado: apenas admin/financeiro' });
        return;
      }

      const { inicio, fim, status, cidade, page, limit } = req.query as any;
      
      const resultado = await this.repo.listarPorPeriodo({
        inicio: inicio as string,
        fim: fim as string,
        status: status as string,
        cidade: cidade as string,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      res.status(200).json({ sucesso: true, ...resultado });
    } catch (e: any) {
      console.error('Erro relatorio transacoes:', e);
      res.status(500).json({ erro: e.message });
    }
  };

  // GET /api/transacoes/estatisticas
  public estatisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcessoAdmin(req as any)) {
        res.status(403).json({ erro: 'Acesso negado' });
        return;
      }

      const stats = await this.repo.obterEstatisticas();
      const porStatus = await this.repo.obterPorStatus();
      const porCidade = await this.repo.obterPorCidade();

      res.status(200).json({
        sucesso: true,
        estatisticas: stats,
        porStatus,
        porCidade
      });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  // GET /api/transacoes/relatorio - alias para compatibilidade
  public relatorioPorPeriodo = async (req: Request, res: Response): Promise<void> => {
    return this.relatorio(req, res);
  };
}
