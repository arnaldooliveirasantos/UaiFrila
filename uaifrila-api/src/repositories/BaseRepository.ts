import { Pool } from 'pg';

export abstract class BaseRepository {
  protected static pool: Pool | null = null;
  protected pool: Pool;

  constructor() {
    if (!BaseRepository.pool) {
      BaseRepository.pool = new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        max: 10
      });
    }
    this.pool = BaseRepository.pool;
  }

  protected async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  protected async queryOne(text: string, params?: any[]) {
    const rows = await this.query(text, params);
    return rows[0] || null;
  }
}