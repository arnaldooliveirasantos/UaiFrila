import { Pool } from 'pg';
import { BaseModel } from '../models/BaseModel';
import { clienteAtual } from '../config/Transaction';
// BaseRepository usa SEMPRE o client da transacao da request (AsyncLocalStorage).
// Fora de request (seed/job) usa o pool. Nenhum repository pode chamar pool.connect()/BEGIN.
export class BaseRepository<T extends BaseModel> {
  private static pool: Pool;
  protected tableName: string;
  protected modelClass: new (data?: any) => T;
  protected primaryKey: string;
  constructor(tableName: string, modelClass: new (data?: any) => T, primaryKey: string = 'id') {
    this.tableName = tableName; this.modelClass = modelClass; this.primaryKey = primaryKey;
  }
  static setPool(pool: Pool) { BaseRepository.pool = pool; }
  static getPool(): Pool { return BaseRepository.pool; }
  protected getPool(): Pool { return BaseRepository.pool; }
  protected async query(sql: string, params: any[] = []): Promise<any> {
    const tx = clienteAtual();
    if (tx) return await tx.query(sql, params);
    const pool = this.getPool();
    if (!pool) throw new Error('Pool nao configurado - chame BaseRepository.setPool');
    return await pool.query(sql, params);
  }
  protected mapRow(row: any): T { return new this.modelClass(row); }
  protected mapRows(rows: any[]): T[] { return rows.map((r: any) => new this.modelClass(r)); }
  private mapToDbColumns(dados: any): any {
    const columns = (this.modelClass as any).getColumns ? (this.modelClass as any).getColumns() : {};
    const mapped: any = {};
    Object.keys(dados).forEach(key => {
      let found = false;
      Object.keys(columns).forEach((prop: string) => {
        const colName = columns[prop].name || prop;
        if (prop === key || colName === key) { mapped[colName] = dados[key]; found = true; }
      });
      if (!found) { const snake = key.replace(/[A-Z]/g, (l: string) => `_${l.toLowerCase()}`); mapped[snake] = dados[key]; }
    });
    return mapped;
  }
  async buscarTodos(): Promise<T[]> { const r = await this.query(`SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey}`); return this.mapRows(r.rows || []); }
  async listarTodos(): Promise<T[]> { return await this.buscarTodos(); }
  async buscarPorId(id: number): Promise<T | null> { const r = await this.query(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1 LIMIT 1`, [id]); const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null; }
  async deletarPorId(id: number): Promise<boolean> { const r = await this.query(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`, [id]); return (r.rowCount || 0) > 0; }
  async deletar(id: number): Promise<boolean> { return await this.deletarPorId(id); }
  async criarGenerico(dados: any): Promise<T> {
    const dbData = this.mapToDbColumns(dados);
    const keys = Object.keys(dbData).filter(k => k !== 'id' && dbData[k] !== undefined);
    if (keys.length === 0) throw new Error('Nenhum dado para criar');
    const cols = keys.join(', '); const ph = keys.map((_, i) => `$${i+1}`).join(', '); const values = keys.map(k => dbData[k]);
    const r = await this.query(`INSERT INTO ${this.tableName} (${cols}) VALUES (${ph}) RETURNING *`, values);
    return this.mapRow((r.rows || [])[0]);
  }
  async atualizarGenerico(id: number, dados: any): Promise<T | null> {
    const dbData = this.mapToDbColumns(dados);
    const keys = Object.keys(dbData).filter(k => k !== 'id' && k !== 'criado_em' && k !== 'atualizado_em' && dbData[k] !== undefined);
    if (keys.length === 0) return await this.buscarPorId(id);
    const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', '); const values = keys.map(k => dbData[k]); values.push(id);
    const r = await this.query(`UPDATE ${this.tableName} SET ${sets}, atualizado_em = NOW() WHERE ${this.primaryKey} = $${values.length} RETURNING *`, values).catch(async () => {
      // Tabelas sem atualizado_em (ex.: algumas de catalogo) — sem mascarar outros erros: so cai aqui se a coluna nao existir.
      return await this.query(`UPDATE ${this.tableName} SET ${sets} WHERE ${this.primaryKey} = $${values.length} RETURNING *`, values);
    });
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async buscarPorIdComRelacoes(id: number): Promise<T | null> {
    const model = await this.buscarPorId(id); if (!model) return null;
    const relations: any[] = (this.modelClass as any).getRelations ? (this.modelClass as any).getRelations() : [];
    for (const rel of relations) {
      if (rel.type === 'belongsTo') {
        try {
          const fkValue = (model as any)[rel.foreignKey] || (model as any)[rel.property + 'Id'];
          if (!fkValue) continue;
          const targetModelClass: any = rel.target(); if (!targetModelClass) continue;
          const targetTable = (targetModelClass as any).tableName; if (!targetTable) continue;
          const r = await this.query(`SELECT * FROM ${targetTable} WHERE id = $1 LIMIT 1`, [fkValue]);
          if (r.rows?.[0]) (model as any)[rel.property] = new targetModelClass(r.rows[0]);
        } catch {}
      }
    }
    return model;
  }
}
