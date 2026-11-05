import { Response } from 'express';
import { BaseController, AuthRequest } from './BaseController';
import { BaseRepository } from '../repositories/BaseRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
import { ExpansaoCidadeModel } from '../models/ExpansaoCidadeModel';

export class VariavelSistemaController extends BaseController {
  listar = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema ORDER BY chave');
      return res.json({ success: true, data: result.rows, variaveis: result.rows });
    } catch (e:any) { return this.handleError(res,e); }
  };
  listarPorCategoria = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema WHERE categoria=$1 ORDER BY chave', [req.params.categoria]);
      return res.json({ success: true, data: result.rows });
    } catch (e:any) { return this.handleError(res,e); }
  };
  buscarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM variaveis_sistema WHERE chave=$1 LIMIT 1', [req.params.chave]);
      if(result.rows.length===0) return this.error(res,'Variável não encontrada',404);
      return res.json({ success: true, data: result.rows[0] });
    } catch (e:any) { return this.handleError(res,e); }
  };
  atualizarPorChave = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN','SUPER_ADMIN']);
      const pool = BaseRepository.getPool();
      const { valor, valor_numerico } = req.body;
      const result = await pool.query('UPDATE variaveis_sistema SET valor=$1, valor_numerico=$2, atualizado_em=NOW() WHERE chave=$3 RETURNING *', [valor, valor_numerico, req.params.chave]);
      if(result.rows.length===0) return this.error(res,'Variável não encontrada',404);
      return res.json({ success: true, data: result.rows[0] });
    } catch (e:any) { return this.handleError(res,e); }
  };
}

export class ExpansaoCidadeController extends BaseController {
  solicitar = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const { cidade_nome, estado_sigla } = req.body;
      const result = await pool.query('INSERT INTO expansao_cidades (cidade_nome, estado_sigla, pais_sigla, status, solicitado_por, criado_em) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *', [cidade_nome, estado_sigla, 'BRA', 'SOLICITADA', req.usuario!.id]);
      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (e:any) { return this.handleError(res,e); }
  };
  listar = async (req: AuthRequest, res: Response) => {
    try {
      const pool = BaseRepository.getPool();
      const result = await pool.query('SELECT * FROM expansao_cidades ORDER BY criado_em DESC');
      return res.json({ success: true, data: result.rows });
    } catch (e:any) { return this.handleError(res,e); }
  };
  atualizarStatus = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN','SUPER_ADMIN']);
      const pool = BaseRepository.getPool();
      const result = await pool.query('UPDATE expansao_cidades SET status=$1, atualizado_em=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
      return res.json({ success: true, data: result.rows[0] });
    } catch (e:any) { return this.handleError(res,e); }
  };
}

export class PermissaoController extends BaseController {
  matriz = async (req: AuthRequest, res: Response) => {
    return res.json({ success: true, data: { message: 'Matriz de permissões - implementar' } });
  };
  meuTipo = async (req: AuthRequest, res: Response) => {
    return res.json({ success: true, data: { tipoUsuarioId: req.usuario?.tipoUsuarioId } });
  };
}

// Stubs para compatibilidade com App antigo que importava EmailController
export class EmailController extends BaseController {
  listarTemplates = async (req: AuthRequest, res: Response) => { return res.json({ success: true, data: [] }); };
  criarTemplate = async (req: AuthRequest, res: Response) => { return res.json({ success: true }); };
  atualizarTemplate = async (req: AuthRequest, res: Response) => { return res.json({ success: true }); };
  listarHistorico = async (req: AuthRequest, res: Response) => { return res.json({ success: true, data: [] }); };
  validarCodigo = async (req: any, res: Response) => { return res.json({ success: true }); };
}
