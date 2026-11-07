import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';

// UsuarioRepository - SEM tu.nome / su.nome em nenhuma query
// Se precisar do tipo, busca em query separada sem JOIN com nome.

export class UsuarioRepository extends BaseRepository<UsuarioModel> {
  constructor() { super(UsuarioModel); }

  async buscarPorEmail(email: string): Promise<any | null> {
    const pool = BaseRepository.getPool() as any;
    // Só usuarios - sem JOIN
    const res = await pool.query(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    return res.rows[0] || null;
  }

  async buscarPorCpf(cpf: string): Promise<any | null> {
    const pool = BaseRepository.getPool() as any;
    const res = await pool.query(`SELECT * FROM usuarios WHERE cpf = $1 LIMIT 1`, [cpf]);
    return res.rows[0] || null;
  }

  async buscarPorId(id: number): Promise<any | null> {
    const pool = BaseRepository.getPool() as any;
    const res = await pool.query(`SELECT * FROM usuarios WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  }
}
