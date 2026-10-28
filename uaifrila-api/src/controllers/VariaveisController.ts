import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';

class VariaveisRepository extends BaseRepository {
  constructor() {
    // Usa estrutura real: id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em
    super('variaveis_sistema');
  }
}

export class VariaveisController {
  private repo = new VariaveisRepository();

  // GET /api/variaveis - qualquer usuario logado pode ver (fix 403)
  // GET /api/transacoes/variaveis - compatibilidade
  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.repo.query(`
        SELECT id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em
        FROM public.variaveis_sistema
        ORDER BY categoria, chave
      `);
      
      res.status(200).json({ 
        sucesso: true,
        variaveis: result,
        total: result.length
      });
    } catch (e: any) {
      console.error('[VariaveisController.listar] Erro:', e);
      // Fallback com valores padrao da sua definicao
      res.status(200).json({
        sucesso: true,
        variaveis: [
          { chave: 'VALOR_MINIMO_VAGA', valor: '75', valor_numerico: 75.00, tipo: 'number', descricao: 'Valor minimo que contratante pode solicitar um servico', categoria: 'vagas', editavel: true },
          { chave: 'TAXA_PIX_PERCENTUAL', valor: '1', valor_numerico: 1.00, tipo: 'number', descricao: 'Taxa PIX 1% sobre subtotal', categoria: 'financeiro', editavel: true },
          { chave: 'TAXA_CARTAO_PERCENTUAL', valor: '4', valor_numerico: 4.00, tipo: 'number', descricao: 'Taxa Cartao 4% sobre subtotal', categoria: 'financeiro', editavel: true },
          { chave: 'COMISSAO_APLICATIVO', valor: '10', valor_numerico: 10.00, tipo: 'number', descricao: 'Comissao app 10% sobre subtotal', categoria: 'financeiro', editavel: true },
          { chave: 'TAXA_PLATAFORMA_PERCENTUAL', valor: '10', valor_numerico: 10.00, tipo: 'number', descricao: 'Alias COMISSAO', categoria: 'financeiro', editavel: true },
          { chave: 'VAGA_ANTECEDENCIA_MINUTOS', valor: '30', valor_numerico: 30.00, tipo: 'number', descricao: 'Antecedencia minima minutos', categoria: 'vagas', editavel: true },
        ],
        fallback: true
      });
    }
  };

  // GET /api/variaveis/:chave
  public obterPorChave = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chave } = req.params;
      const result = await this.repo.query(
        `SELECT id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em
         FROM public.variaveis_sistema WHERE chave = $1`,
        [chave]
      );
      if (result.length === 0) {
        res.status(404).json({ erro: 'Variavel nao encontrada' });
        return;
      }
      res.status(200).json({ sucesso: true, variavel: result[0] });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  // PUT /api/variaveis/:chave - apenas SUPER_ADMIN (nivel 100)
  public atualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chave } = req.params;
      const { valor, valor_numerico, descricao } = req.body;
      
      const nivel = (req as any).usuario?.nivel_permissao || 0;
      const tipoChave = ((req as any).usuario?.tipo_chave || '').toUpperCase();
      if (nivel < 100 && tipoChave !== 'SUPER_ADMIN') {
        res.status(403).json({ erro: 'Apenas SUPER_ADMIN pode alterar variaveis' });
        return;
      }

      // Verifica se editavel
      const check = await this.repo.query(
        `SELECT editavel FROM public.variaveis_sistema WHERE chave = $1`,
        [chave]
      );
      if (check.length > 0 && check[0].editavel === false) {
        res.status(403).json({ erro: 'Variavel nao editavel' });
        return;
      }

      const result = await this.repo.query(
        `UPDATE public.variaveis_sistema 
         SET valor = $1, 
             valor_numerico = $2,
             descricao = COALESCE($3, descricao),
             atualizado_em = NOW()
         WHERE chave = $4
         RETURNING id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em`,
        [String(valor), valor_numerico !== undefined ? Number(valor_numerico) : null, descricao || null, chave]
      );

      if (result.length === 0) {
        res.status(404).json({ erro: 'Variavel nao encontrada' });
        return;
      }

      res.status(200).json({ sucesso: true, mensagem: 'Variavel atualizada', variavel: result[0] });
    } catch (e: any) {
      console.error('[VariaveisController.atualizar] Erro:', e);
      res.status(500).json({ erro: e.message });
    }
  };

  // POST /api/variaveis - criar nova (SUPER_ADMIN)
  public criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chave, valor, valor_numerico, tipo, descricao, categoria, editavel } = req.body;
      
      const nivel = (req as any).usuario?.nivel_permissao || 0;
      const tipoChave = ((req as any).usuario?.tipo_chave || '').toUpperCase();
      if (nivel < 100 && tipoChave !== 'SUPER_ADMIN') {
        res.status(403).json({ erro: 'Apenas SUPER_ADMIN pode criar variaveis' });
        return;
      }

      if (!chave || !valor) {
        res.status(400).json({ erro: 'chave e valor obrigatorios' });
        return;
      }

      const result = await this.repo.query(
        `INSERT INTO public.variaveis_sistema (chave, valor, valor_numerico, tipo, descricao, categoria, editavel)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (chave) DO UPDATE SET
           valor = EXCLUDED.valor,
           valor_numerico = EXCLUDED.valor_numerico,
           tipo = EXCLUDED.tipo,
           descricao = EXCLUDED.descricao,
           categoria = EXCLUDED.categoria,
           editavel = EXCLUDED.editavel,
           atualizado_em = NOW()
         RETURNING id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em`,
        [chave, String(valor), valor_numerico !== undefined ? Number(valor_numerico) : null, tipo || 'string', descricao || null, categoria || 'geral', editavel !== undefined ? editavel : true]
      );

      res.status(201).json({ sucesso: true, variavel: result[0] });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  // DELETE /api/variaveis/:chave - SUPER_ADMIN
  public deletar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { chave } = req.params;
      const nivel = (req as any).usuario?.nivel_permissao || 0;
      if (nivel < 100) {
        res.status(403).json({ erro: 'Apenas SUPER_ADMIN' });
        return;
      }

      const result = await this.repo.query(
        `DELETE FROM public.variaveis_sistema WHERE chave = $1 RETURNING chave`,
        [chave]
      );

      if (result.length === 0) {
        res.status(404).json({ erro: 'Variavel nao encontrada' });
        return;
      }

      res.status(200).json({ sucesso: true, mensagem: `Variavel ${chave} deletada` });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
