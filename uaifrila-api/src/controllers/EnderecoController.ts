
import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';

export class EnderecoController {
  listar = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      if (!pool) { res.json({ sucesso:true, enderecos:[] }); return; }
      const rows = await pool.query('SELECT * FROM enderecos_usuario WHERE usuario_id=$1 ORDER BY is_ativo DESC, criado_em DESC', [usuarioId]);
      const ativo = await pool.query('SELECT * FROM enderecos_usuario WHERE usuario_id=$1 AND is_ativo=true LIMIT 1', [usuarioId]);
      res.json({ sucesso:true, enderecos: rows.rows, ativo: ativo.rows[0] || null });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  criar = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      if (!pool) throw new Error('Pool não configurado');
      const { endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng } = req.body;
      await pool.query('UPDATE enderecos_usuario SET is_ativo=false WHERE usuario_id=$1', [usuarioId]);
      const rows = await pool.query('INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *', [usuarioId, endereco_completo, bairro, cidade_id, cidade_nome, estado||'MG', lat, lng]);
      res.json({ sucesso:true, endereco: rows.rows[0] });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  ativar = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      const enderecoId = req.params.id;
      if (!pool) throw new Error('Pool não configurado');
      await pool.query('UPDATE enderecos_usuario SET is_ativo=false WHERE usuario_id=$1', [usuarioId]);
      const rows = await pool.query('UPDATE enderecos_usuario SET is_ativo=true, atualizado_em=NOW() WHERE id=$1 AND usuario_id=$2 RETURNING *', [enderecoId, usuarioId]);
      res.json({ sucesso:true, endereco: rows.rows[0] });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      const enderecoId = req.params.id;
      if (!pool) throw new Error('Pool não configurado');
      const { endereco_completo, bairro, cidade_nome } = req.body;
      const rows = await pool.query('UPDATE enderecos_usuario SET endereco_completo=$1, bairro=$2, cidade_nome=$3, atualizado_em=NOW() WHERE id=$4 AND usuario_id=$5 RETURNING *', [endereco_completo, bairro, cidade_nome, enderecoId, usuarioId]);
      res.json({ sucesso:true, endereco: rows.rows[0] });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  deletar = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      const enderecoId = req.params.id;
      if (!pool) throw new Error('Pool não configurado');
      await pool.query('DELETE FROM enderecos_usuario WHERE id=$1 AND usuario_id=$2', [enderecoId, usuarioId]);
      res.json({ sucesso:true });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  verificarTrampo = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      const usuarioId = (req as any).usuario?.id;
      if (!pool) { res.json({ sucesso:true, emAndamento:false }); return; }
      const rows = await pool.query("SELECT COUNT(*) as total FROM trampos WHERE freela_id=$1 AND status IN ('EM_ANDAMENTO','ACEITO')", [usuarioId]);
      res.json({ sucesso:true, emAndamento: parseInt(rows.rows[0].total) > 0 });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };
}
