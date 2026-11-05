import { BaseRepository } from './BaseRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
export class VariavelSistemaRepository extends BaseRepository<VariavelSistemaModel> {
  constructor() { super('variaveis_sistema', VariavelSistemaModel); }
  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> {
    const result = await this.query(`SELECT * FROM variaveis_sistema WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> {
    const result = await this.query(`SELECT * FROM variaveis_sistema WHERE categoria = $1 ORDER BY chave`, [categoria]);
    return this.mapRows(result.rows || result);
  }
}
