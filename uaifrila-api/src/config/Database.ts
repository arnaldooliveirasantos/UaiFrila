import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// UNICA fonte do pool da API. App.ts, middlewares e repositories usam este pool.
// Aceita DATABASE_URL ou as partes DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME.
// Sem log de connection string, sem fallback silencioso: sem config, falha na subida.
function montarConnectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  const user = process.env.DB_USER; const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST || 'localhost'; const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  if (!user || !password || !db) throw new Error('Defina DATABASE_URL ou DB_USER/DB_PASSWORD/DB_NAME no .env');
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}
export const pool = new Pool({ connectionString: montarConnectionString(), options: '-c timezone=UTC' });
pool.on('error', (err) => { console.error('[database] Erro pool:', err); });
export function getPool(): Pool { return pool; }
export default pool;
