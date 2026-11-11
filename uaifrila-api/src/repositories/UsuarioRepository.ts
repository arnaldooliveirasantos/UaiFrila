import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';

// UsuarioRepository - CORRIGIDO TS2554
// Antes: super(UsuarioModel) -> faltava tableName
// BaseRepository espera: constructor(tableName: string, modelClass, primaryKey = 'id')
// Todos os outros repos fazem: super('tabela', Model) - ex: super('vagas', VagaModel)
// SEM tu.nome / su.nome em nenhuma query

export class UsuarioRepository extends BaseRepository<UsuarioModel> {
  constructor() { super('usuarios', UsuarioModel); }

  async buscarPorEmail(email: string): Promise<any | null> {
    const pool = BaseRepository.getPool() as any;
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
