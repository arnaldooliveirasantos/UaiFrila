import { BaseRepository } from './BaseRepository';
import { PaisModel } from '../models/PaisModel';
export class PaisRepository extends BaseRepository<PaisModel> {
  constructor() { super('paises', PaisModel); }
  async buscarPorSigla(sigla: string): Promise<PaisModel | null> {
    const result = await this.query(`SELECT * FROM paises WHERE sigla = $1 LIMIT 1`, [sigla]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
