import { BaseRepository } from './BaseRepository';
import { TrampoModel } from '../models/TrampoModel';
export class TrampoRepository extends BaseRepository<TrampoModel> {
  constructor() { super('trampos', TrampoModel); }
  async listarPorUsuario(usuarioId: number): Promise<TrampoModel[]> {
    const result = await this.query(`SELECT * FROM trampos WHERE freela_id = $1 OR contratante_id = $1 ORDER BY criado_em DESC`, [usuarioId]);
    return this.mapRows(result.rows||result);
  }
  async buscarPorVaga(vagaId: number): Promise<TrampoModel | null> {
    const result = await this.query(`SELECT * FROM trampos WHERE vaga_id = $1 LIMIT 1`, [vagaId]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async listarPorStatus(status: string): Promise<TrampoModel[]> {
    const result = await this.query(`SELECT * FROM trampos WHERE status = $1 ORDER BY criado_em DESC`, [status]);
    return this.mapRows(result.rows || result);
  }
}
