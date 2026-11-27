import { BaseRepository } from './BaseRepository';
import { CategoriaFuncaoModel } from '../models/CategoriaFuncaoModel';
export class CategoriaFuncaoRepository extends BaseRepository<CategoriaFuncaoModel> {
  constructor() { super('categorias_funcao', CategoriaFuncaoModel); }
  async listarAtivas(): Promise<CategoriaFuncaoModel[]> {
    const r = await this.query(`SELECT * FROM categorias_funcao WHERE ativa = true ORDER BY nome`);
    return this.mapRows(r.rows || []);
  }
}
