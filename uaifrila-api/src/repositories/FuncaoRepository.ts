import { BaseRepository } from './BaseRepository';
import { FuncaoModel } from '../models/FuncaoModel';
export class FuncaoRepository extends BaseRepository<FuncaoModel> {
  constructor() { super('funcoes', FuncaoModel); }
  async listarAtivas(): Promise<FuncaoModel[]> { const r = await this.query(`SELECT f.*, cf.nome AS categoria_nome FROM funcoes f LEFT JOIN categorias_funcao cf ON cf.id = f.categoria_id WHERE f.ativa = true ORDER BY f.nome`); return this.mapRows(r.rows || []); }
  async buscarPorNome(nome: string): Promise<FuncaoModel | null> { const r = await this.query(`SELECT * FROM funcoes WHERE LOWER(nome) = LOWER($1) LIMIT 1`, [nome]); const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null; }
}
