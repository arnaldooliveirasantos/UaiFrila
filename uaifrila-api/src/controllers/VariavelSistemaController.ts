import { Response } from 'express';
import { VariavelSistemaService } from '../services/VariavelSistemaService';
import { BaseController, AuthRequest } from './BaseController';
import { BaseRepository } from '../repositories/BaseRepository';

// Controller para a tabela EXISTENTE variaveis_sistema
// Mantém os mesmos endpoints do SistemaControllers.ts existente:
// GET /api/variaveis, GET /api/variaveis/categoria/:categoria, GET /api/variaveis/chave/:chave, PUT /api/variaveis/chave/:chave
export class VariavelSistemaController extends BaseController {
  private service: VariavelSistemaService;
  constructor() { super(); this.service = new VariavelSistemaService(); }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema ORDER BY chave');
      return res.json({ success: true, data: result.rows, variaveis: result.rows });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorCategoria = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema WHERE categoria = $1 ORDER BY chave', [req.params.categoria]);
      return res.json({ success: true, data: result.rows });
    } catch (e: any) { return this.handleError(res, e); }
  };

  // Alias para quem chamava listarPorGrupo
  listarPorGrupo = async (req: AuthRequest, res: Response) => {
    return this.listarPorCategoria(req, res);
  };

  buscarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema WHERE chave = $1 LIMIT 1', [req.params.chave]);
      if (result.rows.length === 0) return this.error(res, 'Variável não encontrada', 404);
      return res.json({ success: true, data: result.rows[0] });
    } catch (e: any) { return this.handleError(res, e); }
  };

  // PUT /api/variaveis/chave/:chave { valor, valor_numerico? }
  // Sincroniza valor + valor_numerico como o controller existente fazia
  atualizarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const pool = BaseRepository.getPool();
      const { valor, valor_numerico } = req.body;
      const num = valor_numerico !== undefined ? Number(valor_numerico) : parseFloat(String(valor));
      const result = await pool.query(
        'UPDATE variaveis_sistema SET valor = $1, valor_numerico = $2, atualizado_em = NOW() WHERE chave = $3 RETURNING *',
        [String(valor), isNaN(num) ? null : num, req.params.chave]
      );
      if (result.rows.length === 0) return this.error(res, 'Variável não encontrada', 404);
      return res.json({ success: true, data: result.rows[0] });
    } catch (e: any) { return this.handleError(res, e); }
  };

  // Alias para o nome usado em alguns App.ts: atualizarPorChave
  atualizar = async (req: AuthRequest, res: Response) => {
    return this.atualizarPorChave(req, res);
  };
}
