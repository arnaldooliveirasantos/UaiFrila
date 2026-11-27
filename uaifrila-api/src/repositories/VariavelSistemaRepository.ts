import { BaseRepository } from './BaseRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
export class VariavelSistemaRepository extends BaseRepository<VariavelSistemaModel> {
  constructor() { super('variaveis_sistema', VariavelSistemaModel); }
  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> { const r = await this.query(`SELECT * FROM variaveis_sistema WHERE chave = $1 LIMIT 1`, [chave]); return r.rows?.[0] ? this.mapRow(r.rows[0]) : null; }
  async buscarValorObrigatorio(chave: string): Promise<string> { const v = await this.buscarPorChave(chave); if (!v || v.valor == null) throw new Error(`Variavel de sistema nao encontrada: ${chave}`); return v.valor; }
  async buscarNumeroObrigatorio(chave: string): Promise<number> { const v = await this.buscarPorChave(chave); if (!v) throw new Error(`Variavel de sistema nao encontrada: ${chave}`); const n = parseFloat((v as any).valor_numerico ?? (v as any).valorNumerico ?? v.valor); if (isNaN(n)) throw new Error(`Variavel de sistema sem valor numerico: ${chave}`); return n; }
  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> { const r = await this.query(`SELECT * FROM variaveis_sistema WHERE categoria = $1 ORDER BY chave`, [categoria]); return this.mapRows(r.rows || []); }
}
