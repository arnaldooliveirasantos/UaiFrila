import { BaseRepository } from './BaseRepository';
import { FuncaoModel } from '../models/FuncaoModel';
export class FuncaoRepository extends BaseRepository<FuncaoModel> {
  constructor() { super('funcoes', FuncaoModel); }
  async listarAtivas(): Promise<FuncaoModel[]> {
    const result = await this.query(`SELECT * FROM funcoes WHERE ativa = true ORDER BY nome`);
    return this.mapRows(result.rows || result);
  }
  async buscarPorNome(nome: string): Promise<FuncaoModel | null> {
    const result = await this.query(`SELECT * FROM funcoes WHERE LOWER(nome) = LOWER($1) LIMIT 1`, [nome]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
