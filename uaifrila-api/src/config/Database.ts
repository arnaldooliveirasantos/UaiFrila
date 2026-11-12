import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// CORRECAO do DeprecationWarning do pg:
//   "Calling client.query() when the client is already executing a query"
// Causa era o pool.on('connect') com client.query("SET TIME ZONE...") — o pg nao espera
// o handler do evento. Timezone agora vai em options: '-c timezone=UTC'.
// CORRECAO do erro "DATABASE_URL nao definida no .env":
//   o .env deste projeto NAO tem DATABASE_URL — tem as partes separadas:
//   DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME.
//   Este arquivo agora aceita OS DOIS formatos:
//     1) se DATABASE_URL existir, usa ela;
//     2) se nao, monta a URL a partir de DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME.
//   A senha e codificada com encodeURIComponent (a sua tem @ e ! — sem isso a URL quebra).
function montarConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url && url.trim()) return url.trim();
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  if (!user || !password || !db) {
    throw new Error('DATABASE_URL nao definida no .env e faltam DB_USER / DB_PASSWORD / DB_NAME — defina um dos dois formatos no .env');
  }
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}
const connectionString = montarConnectionString();
console.log('[database.ts] Conectando com:', connectionString.replace(/:[^:@]+@/, ':****@'));
const pool = new Pool({
  connectionString: connectionString as string,
  options: '-c timezone=UTC',
});
pool.on('error', (err) => {
  console.error('[database.ts] Erro pool:', err);
});
export { pool };
export default pool;
