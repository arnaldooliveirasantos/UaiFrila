import { BaseRepository } from './BaseRepository';
import { TipoUsuarioModel } from '../models/TipoUsuarioModel';
export class TipoUsuarioRepository extends BaseRepository<TipoUsuarioModel> {
  constructor() { super('tipos_usuario', TipoUsuarioModel); }
  async buscarPorChave(chave: string): Promise<TipoUsuarioModel | null> {
    const result = await this.query(`SELECT * FROM tipos_usuario WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
