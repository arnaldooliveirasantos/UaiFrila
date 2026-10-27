import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Carrega .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export abstract class BaseRepository {
  protected static pool: Pool | null = null;
  protected pool: Pool;

  constructor() {
    if (BaseRepository.pool) {
      this.pool = BaseRepository.pool;
      return;
    }

    // Usa DB_* com String() para fix SASL
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;

    if (!dbUser || !dbPassword) {
      throw new Error('DB_USER ou DB_PASSWORD não definidas no .env - causa SASL error');
    }

    BaseRepository.pool = new Pool({
      user: String(dbUser),
      password: String(dbPassword), // String() FIX SASL
      host: String(dbHost || 'localhost'),
      port: parseInt(String(dbPort || '5432'), 10),
      database: String(dbName || 'uaifrila'),
      max: 10
    });

    BaseRepository.pool.on('connect', async (client) => {
      try { await client.query("SET TIME ZONE 'UTC'"); } catch {}
    });

    BaseRepository.pool.on('error', (err) => {
      console.error('Pool error:', err);
    });

    this.pool = BaseRepository.pool;
  }

  static setPool(pool: Pool) {
    BaseRepository.pool = pool;
    pool.on('connect', async (client) => {
      try { await client.query("SET TIME ZONE 'UTC'"); } catch {}
    });
    console.log('[BaseRepository] Pool configurado via setPool - UTC0 - DB_*');
  }

  protected async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      await client.query("SET TIME ZONE 'UTC'");
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

  protected utcSelect(column: string): string {
    return `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ${column}`;
  }
}
