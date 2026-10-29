import { Pool } from 'pg';

export class BaseRepository {
  private static pool: Pool | null = null;

  public static setPool(pool: Pool) {
    BaseRepository.pool = pool;
  }

  public static getPool(): Pool | null {
    return BaseRepository.pool;
  }

  protected get pool(): Pool {
    if (!BaseRepository.pool) {
      throw new Error('Pool não configurado. Verifique App.ts configurarBanco()');
    }
    return BaseRepository.pool;
  }

  protected async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  protected async queryOne(sql: string, params: any[] = []): Promise<any | null> {
    const result = await this.pool.query(sql, params);
    return result.rows[0] || null;
  }
}
