import fs from 'fs'; import path from 'path'; import { Pool } from 'pg';
// Logger do worker: caminho vem de variaveis_sistema CAMINHO_LOG_EMAIL_WORKER.
// Nunca logar codigo_verificacao, email completo, senha ou token. Email e mascarado.
export function mascararEmail(e: string) { if (!e || !e.includes('@')) return '[email]'; const [u, d] = e.split('@'); return `${u.slice(0,2)}***@${d}`; }
let cache: { v: string; t: number } | null = null;
export async function resolverCaminho(pool: Pool): Promise<string> {
  if (cache && Date.now() - cache.t < 60000) return cache.v;
  try { const r = await pool.query(`SELECT valor FROM variaveis_sistema WHERE chave='CAMINHO_LOG_EMAIL_WORKER' LIMIT 1`); const v = (r.rows?.[0]?.valor || '').trim(); if (v) { cache = { v, t: Date.now() }; return v; } } catch {}
  const v = (process.env.LOG_PATH_EMAIL_WORKER || '').trim() || path.join(process.cwd(), 'logs', 'email-worker');
  cache = { v, t: Date.now() }; return v;
}
export class WorkerLogger {
  private arquivo = ''; private pronto: Promise<void>;
  constructor(private pool: Pool) { this.pronto = resolverCaminho(pool).then(d => { fs.mkdirSync(d, { recursive: true }); this.arquivo = path.join(d, `email-worker-${new Date().toISOString().slice(0,10)}.log`); }).catch(() => {}); }
  private async out(nivel: string, msg: string, meta?: any) { await this.pronto.catch(() => {}); const l = `${new Date().toISOString()} [email-worker] [${nivel}] ${msg}${meta !== undefined ? ' ' + JSON.stringify(meta) : ''}\n`; if (this.arquivo) { try { fs.appendFileSync(this.arquivo, l); } catch {} } if (process.env.NODE_ENV !== 'production') process.stdout.write(l); }
  info(m: string, meta?: any) { return this.out('INFO', m, meta); } warn(m: string, meta?: any) { return this.out('WARN', m, meta); } error(m: string, meta?: any) { return this.out('ERROR', m, meta); }
}
