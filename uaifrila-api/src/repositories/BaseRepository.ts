import { Pool } from 'pg';
import { config } from '../config/env';

export abstract class BaseRepository {
  protected static pool: Pool | null = null;
  protected pool: Pool;

  constructor() {
    if (!BaseRepository.pool) {
      BaseRepository.pool = new Pool({
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        host: config.DB_HOST,
        port: config.DB_PORT,
        database: config.DB_NAME,
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

  protected async execute(text: string, params?: any[]) {
    return this.query(text, params);
  }
}
