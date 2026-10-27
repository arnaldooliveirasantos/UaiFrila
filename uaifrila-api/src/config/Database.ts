import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Garante que DATABASE_URL é string válida
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não definida no .env');
}

console.log('[database.ts] Conectando com:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: connectionString as string, // Força string - fix SASL
});

pool.on('connect', async (client) => {
  await client.query("SET TIME ZONE 'UTC'");
  console.log('[database.ts] Conexão UTC0 estabelecida');
});

pool.on('error', (err) => {
  console.error('[database.ts] Erro pool:', err);
});

export { pool };
export default pool;
