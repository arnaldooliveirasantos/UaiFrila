import { BaseRepository } from './BaseRepository';
import { TipoEnderecoModel } from '../models/TipoEnderecoModel';
export class TipoEnderecoRepository extends BaseRepository<TipoEnderecoModel> {
  constructor() { super('tipos_endereco', TipoEnderecoModel); }
  async buscarPorChave(chave: string): Promise<TipoEnderecoModel | null> {
    const result = await this.query(`SELECT * FROM tipos_endereco WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async listarAtivos(): Promise<TipoEnderecoModel[]> {
    const result = await this.query(`SELECT * FROM tipos_endereco WHERE ativo = true ORDER BY nome`);
    return this.mapRows(result.rows || result);
  }
}
