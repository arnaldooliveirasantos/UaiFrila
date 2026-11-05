import { Pool } from 'pg';
import { BaseModel } from '../models/BaseModel';

export class BaseRepository<T extends BaseModel> {
  private static pool: Pool;
  protected tableName: string;
  protected modelClass: new (data?: any) => T;
  protected primaryKey: string;

  constructor(tableName: string, modelClass: new (data?: any) => T, primaryKey: string = 'id') {
    this.tableName = tableName;
    this.modelClass = modelClass;
    this.primaryKey = primaryKey;
  }

  static setPool(pool: Pool) { BaseRepository.pool = pool; }
  static getPool(): Pool { return BaseRepository.pool; }
  protected getPool(): Pool { return BaseRepository.pool; }

  protected async query(sql: string, params: any[] = []): Promise<any> {
    const pool = this.getPool();
    if (!pool) throw new Error('Pool não configurado - chame BaseRepository.setPool');
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
        if (prop === key || colName === key) {
          mapped[colName] = dados[key];
          found = true;
        }
      });
      if (!found) {
        const snake = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
        mapped[snake] = dados[key];
      }
    });
    return mapped;
  }

  async buscarTodos(): Promise<T[]> {
    const result = await this.query(`SELECT * FROM ${this.tableName} ORDER BY ${this.primaryKey}`);
    return this.mapRows(result.rows || []);
  }
  async listarTodos(): Promise<T[]> { return await this.buscarTodos(); }

  async buscarPorId(id: number): Promise<T | null> {
    const result = await this.query(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1 LIMIT 1`, [id]);
    const rows = result.rows || [];
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async deletarPorId(id: number): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }
  async deletar(id: number): Promise<boolean> { return await this.deletarPorId(id); }

  async criarGenerico(dados: any): Promise<T> {
    const dbData = this.mapToDbColumns(dados);
    const keys = Object.keys(dbData).filter(k => k !== 'id' && dbData[k] !== undefined);
    if (keys.length === 0) throw new Error('Nenhum dado para criar');
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
    const values = keys.map(k => dbData[k]);
    const result = await this.query(`INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders}) RETURNING *`, values);
    return this.mapRow((result.rows || [])[0]);
  }

  async atualizarGenerico(id: number, dados: any): Promise<T | null> {
    const dbData = this.mapToDbColumns(dados);
    const keys = Object.keys(dbData).filter(k => k !== 'id' && k !== 'criado_em' && k !== 'atualizado_em' && dbData[k] !== undefined);
    if (keys.length === 0) return await this.buscarPorId(id);
    const sets = keys.map((k, i) => `${k} = $${i+1}`).join(', ');
    const values = keys.map(k => dbData[k]);
    values.push(id);
    try {
      const result = await this.query(`UPDATE ${this.tableName} SET ${sets}, atualizado_em = NOW() WHERE ${this.primaryKey} = $${values.length} RETURNING *`, values);
      return (result.rows || [])[0] ? this.mapRow((result.rows || [])[0]) : null;
    } catch {
      const result = await this.query(`UPDATE ${this.tableName} SET ${sets} WHERE ${this.primaryKey} = $${values.length} RETURNING *`, values);
      return (result.rows || [])[0] ? this.mapRow((result.rows || [])[0]) : null;
    }
  }

  async buscarPorIdComRelacoes(id: number): Promise<T | null> {
    const model = await this.buscarPorId(id);
    if (!model) return null;
    const relations: any[] = (this.modelClass as any).getRelations ? (this.modelClass as any).getRelations() : [];
    for (const rel of relations) {
      if (rel.type === 'belongsTo') {
        try {
          const fkValue = (model as any)[rel.foreignKey] || (model as any)[rel.property + 'Id'] || (model as any)[rel.foreignKey.replace(/_([a-z])/g, (_:any,l:string)=>l.toUpperCase())];
          if (!fkValue) continue;
          const targetModelClass: any = rel.target();
          if(!targetModelClass) continue;
          const targetTable = (targetModelClass as any).tableName;
          if(!targetTable) continue;
          const result = await this.query(`SELECT * FROM ${targetTable} WHERE id = $1 LIMIT 1`, [fkValue]);
          const rows = result.rows || [];
          if (rows[0]) (model as any)[rel.property] = new targetModelClass(rows[0]);
        } catch {}
      }
    }
    return model;
  }
}
