import { BaseRepository } from './BaseRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';

export class VariavelSistemaRepository extends BaseRepository<VariavelSistemaModel> {
  constructor() { super('variaveis_sistema', VariavelSistemaModel); }

  // SEM filtro ativo - tabela existente NÃO tem coluna ativo
  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> {
    const r = await this.query(`SELECT * FROM variaveis_sistema WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = r.rows || r;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  // Prioridade: valor_numerico (numérico) -> valor (texto) -> fallback
  // Mesmo padrão do VagaController.calcular existente
  async buscarNumero(chave: string, fallback: number): Promise<number> {
    const v: any = await this.buscarPorChave(chave);
    if (!v) return fallback;
    const n = parseFloat(v.valor_numerico ?? v.valorNumerico ?? v.valor);
    return isNaN(n) ? fallback : n;
  }

  async buscarValor(chave: string, fallback: string): Promise<string> {
    const v: any = await this.buscarPorChave(chave);
    if (!v) return fallback;
    return v.valor ?? String(fallback);
  }

  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> {
    const r = await this.query(`SELECT * FROM variaveis_sistema WHERE categoria = $1 ORDER BY chave`, [categoria]);
    return this.mapRows(r.rows || r);
  }
}
