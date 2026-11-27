import { BaseRepository } from './BaseRepository';
import { StatusVagaModel } from '../models/StatusVagaModel';
export class StatusVagaRepository extends BaseRepository<StatusVagaModel> {
  constructor() { super('status_vaga', StatusVagaModel); }
  async buscarPorChave(chave: string): Promise<StatusVagaModel | null> { const r = await this.query(`SELECT * FROM status_vaga WHERE chave = $1 LIMIT 1`, [chave]); const rows = r.rows || r; return rows[0] ? this.mapRow(rows[0]) : null; }
  async listarAtivos(): Promise<StatusVagaModel[]> { const r = await this.query(`SELECT * FROM status_vaga WHERE ativo = true ORDER BY ordem ASC`); return this.mapRows(r.rows || r); }
  async listarOrdenado(): Promise<StatusVagaModel[]> { const r = await this.query(`SELECT * FROM status_vaga ORDER BY ordem ASC`); return this.mapRows(r.rows || r); }
}
