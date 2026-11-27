import fs from 'fs'; import path from 'path'; import { Pool } from 'pg';
// Logger do worker de geocodificacao. Caminho: variaveis_sistema CAMINHO_LOG_GEOCODIFICACAO_WORKER,
// senao LOG_PATH_GEOCODIFICACAO_WORKER, senao <raiz>/logs/geocodificacao-worker.
// NUNCA loga endereco completo, senha ou token. Loga id do endereco, cidade, CEP e motivo.
let cache: { v: string; t: number } | null = null;
export async function resolverCaminho(pool: Pool): Promise<string> {
  if (cache && Date.now() - cache.t < 60000) return cache.v;
  try { const r = await pool.query(`SELECT valor FROM variaveis_sistema WHERE chave='CAMINHO_LOG_GEOCODIFICACAO_WORKER' LIMIT 1`); const v = (r.rows?.[0]?.valor || '').trim(); if (v) { cache = { v, t: Date.now() }; return v; } } catch (e) { console.error('[geocodificacao-worker] falha ao ler caminho do log', (e as any)?.message); }
  const v = (process.env.LOG_PATH_GEOCODIFICACAO_WORKER || '').trim() || path.join(process.cwd(), 'logs', 'geocodificacao-worker');
  cache = { v, t: Date.now() }; return v;
}
export class WorkerLogger {
  private arquivo = ''; private pronto: Promise<void>;
  constructor(private pool: Pool) { this.pronto = resolverCaminho(pool).then(d => { fs.mkdirSync(d, { recursive: true }); this.arquivo = path.join(d, `geocodificacao-worker-${new Date().toISOString().slice(0,10)}.log`); }).catch(() => {}); }
  private async out(nivel: string, msg: string, meta?: any) { await this.pronto.catch(() => {}); const l = `${new Date().toISOString()} [geocodificacao-worker] [${nivel}] ${msg}${meta !== undefined ? ' ' + JSON.stringify(meta) : ''}\n`; if (this.arquivo) { try { fs.appendFileSync(this.arquivo, l); } catch {} } if (process.env.NODE_ENV !== 'production') process.stdout.write(l); }
  info(m: string, meta?: any) { return this.out('INFO', m, meta); } warn(m: string, meta?: any) { return this.out('WARN', m, meta); } error(m: string, meta?: any) { return this.out('ERROR', m, meta); }
}
