import { Request, Response } from 'express';
import { TransacaoRepository } from '../repositories/TransacaoRepository';

export class TransacaoController {
  private repo = new TransacaoRepository();

  // OOP: Validação usando tipos_usuario nivel_permissao
  private async validarAcessoAdmin(req: any): Promise<boolean> {
    const user = req.user;
    if (!user) return false;
    const nivel = user.nivel_permissao || 0;
    const chave = (user.tipo_chave || user.role || '').toUpperCase();
    return nivel >= 50 || ['FINANCEIRO','ADMIN','SUPER_ADMIN','MODERADOR'].includes(chave);
  }

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

  public variaveis = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcessoAdmin(req as any)) {
        res.status(403).json({ erro: 'Acesso negado' });
        return;
      }

      const variaveis = await (this.repo as any).query(`
        SELECT * FROM variaveis_sistema ORDER BY categoria, chave
      `);

      res.status(200).json({ sucesso: true, variaveis });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public salvarVariavel = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!await this.validarAcessoAdmin(req as any)) {
        res.status(403).json({ erro: 'Acesso negado: apenas super_admin' });
        return;
      }

      const { chave, valor, valor_numerico } = req.body;
      if (!chave || valor === undefined) {
        res.status(400).json({ erro: 'Chave e valor obrigatórios' });
        return;
      }

      const result = await (this.repo as any).query(`
        UPDATE variaveis_sistema 
        SET valor = $2, valor_numerico = $3, atualizado_em = NOW()
        WHERE chave = $1
        RETURNING *
      `, [chave, valor, valor_numerico || null]);

      res.status(200).json({ sucesso: true, variavel: result[0] });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
