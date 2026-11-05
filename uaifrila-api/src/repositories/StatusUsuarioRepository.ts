import { BaseRepository } from './BaseRepository';
import { StatusUsuarioModel } from '../models/StatusUsuarioModel';
export class StatusUsuarioRepository extends BaseRepository<StatusUsuarioModel> {
  constructor() { super('status_usuario', StatusUsuarioModel); }
  async buscarPorChave(chave: string): Promise<StatusUsuarioModel | null> {
    const result = await this.query(`SELECT * FROM status_usuario WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
