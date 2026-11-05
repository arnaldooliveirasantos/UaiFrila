
import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';

export class PermissaoController {
  private async q(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const pool = (BaseRepository as any).getPool();
      if (!pool) return [];
      const result: any = await pool.query(sql, params);
      return result.rows || result || [];
    } catch (e) {
      console.error('[PermissaoController] Erro query:', (e as any).message);
      return [];
    }
  }

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const permissoes = await this.q(`SELECT p.*, tu.nome as tipo_nome FROM permissoes p LEFT JOIN tipos_usuario tu ON tu.id = p.tipo_id ORDER BY p.categoria, p.nome`);
      res.json({ sucesso: true, permissoes });
    } catch (e: any) {
      res.json({ sucesso: true, permissoes: [], aviso: e.message });
    }
  };

  matriz = async (req: Request, res: Response): Promise<void> => {
    try {
      const permissoes = await this.q(`SELECT * FROM permissoes ORDER BY categoria, nome`);
      const matriz: any = {};
      permissoes.forEach((p: any) => {
        const cat = p.categoria || 'geral';
        if (!matriz[cat]) matriz[cat] = [];
        matriz[cat].push(p);
      });
      res.json({ sucesso: true, matriz, permissoes });
    } catch (e: any) {
      console.error('[PermissaoController.matriz] Erro:', e.message);
      res.json({ sucesso: true, matriz: {}, permissoes: [] });
    }
  };

  categorias = async (req: Request, res: Response): Promise<void> => {
    try {
      const rows = await this.q(`SELECT DISTINCT categoria FROM permissoes WHERE categoria IS NOT NULL ORDER BY categoria`);
      res.json({ sucesso: true, categorias: rows.map((r: any) => r.categoria) });
    } catch (e: any) {
      res.json({ sucesso: true, categorias: [] });
    }
  };

  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const pool = (BaseRepository as any).getPool();
      const { nome, chave, categoria, descricao, tipo_id } = req.body;
      const result: any = await pool.query(`INSERT INTO permissoes (nome, chave, categoria, descricao, tipo_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [nome, chave, categoria, descricao, tipo_id]);
      res.status(201).json({ sucesso: true, permissao: (result.rows || result)[0] });
    } catch (e: any) {
      res.status(400).json({ sucesso: false, erro: e.message });
    }
  };

  atualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const pool = (BaseRepository as any).getPool();
      const { id } = req.params;
      const { nome, categoria, descricao } = req.body;
      const result: any = await pool.query(`UPDATE permissoes SET nome = COALESCE($1,nome), categoria = COALESCE($2,categoria), descricao = COALESCE($3,descricao) WHERE id = $4 RETURNING *`, [nome, categoria, descricao, id]);
      res.json({ sucesso: true, permissao: (result.rows || result)[0] });
    } catch (e: any) {
      res.status(400).json({ sucesso: false, erro: e.message });
    }
  };
}
