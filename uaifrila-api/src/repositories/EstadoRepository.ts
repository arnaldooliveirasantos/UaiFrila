import { BaseRepository } from './BaseRepository';
import { EstadoModel } from '../models/EstadoModel';
export class EstadoRepository extends BaseRepository<EstadoModel> {
  constructor() { super('estados', EstadoModel); }
  async buscarPorSigla(sigla: string): Promise<EstadoModel | null> {
    const result = await this.query(`SELECT * FROM estados WHERE sigla = $1 LIMIT 1`, [sigla]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async listarPorPais(paisId: number): Promise<EstadoModel[]> {
    const result = await this.query(`SELECT * FROM estados WHERE pais_id = $1 ORDER BY nome`, [paisId]);
    return this.mapRows(result.rows || result);
  }
  async listarAtivos(): Promise<EstadoModel[]> {
    const result = await this.query(`SELECT * FROM estados WHERE ativo = true ORDER BY sigla`);
    return this.mapRows(result.rows || result);
  }
}
