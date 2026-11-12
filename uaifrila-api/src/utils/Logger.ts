import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Logger em ARQUIVO. Caminho vem de variaveis_sistema (chave passada no construtor).
// Windows (dev): ex. C:\logs\uaifrila\api  | Linux (prod): /var/log/uaifrila/api
// Se o banco ainda nao respondeu / variavel nao existe: usa LOG_PATH (env) e,
// por ultimo, <raiz-do-projeto>/logs/<app> — nunca caminho fixo de outro SO, nunca console como log.
// NUNCA logar codigo_verificacao, senha, token ou Authorization.
const SENSIVEIS = [/codigo_verificacao/i, /codigo/i, /senha/i, /password/i, /token/i, /authorization/i, /smtp_pass/i];
export function sanitizar(obj: any): any {
  if (obj == null) return obj;
  if (typeof obj === 'string') return obj;
  try {
    const copia: any = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const k of Object.keys(copia)) {
      if (SENSIVEIS.some(r => r.test(k))) copia[k] = '[REDACTED]';
      else if (typeof copia[k] === 'object') copia[k] = sanitizar(copia[k]);
    }
    return copia;
  } catch { return '[unserializable]'; }
}
let cache: { valor: string; lidoEm: number } | null = null;
export async function resolverCaminhoLog(pool: Pool, chave: string, fallbackEnv: string, app: string): Promise<string> {
  const agora = Date.now();
  if (cache && agora - cache.lidoEm < 60_000) return cache.valor;
  try {
    const r = await pool.query(`SELECT valor FROM variaveis_sistema WHERE chave=$1 LIMIT 1`, [chave]);
    const v = (r.rows?.[0]?.valor || '').trim();
    if (v) { cache = { valor: v, lidoEm: agora }; return v; }
  } catch {}
  const v = (process.env[fallbackEnv] || '').trim()
    || path.join(process.cwd(), 'logs', app);
  cache = { valor: v, lidoEm: agora }; return v;
}
export class Logger {
  private arquivo = '';
  private pronto: Promise<void>;
  constructor(private pool: Pool, private chave: string, private fallbackEnv: string, private app: string) {
    this.pronto = resolverCaminhoLog(pool, chave, fallbackEnv, app).then(dir => {
      fs.mkdirSync(dir, { recursive: true });
      this.arquivo = path.join(dir, `${app}-${new Date().toISOString().slice(0,10)}.log`);
    }).catch(() => { this.arquivo = ''; });
  }
  private linha(nivel: string, msg: string, meta?: any) {
    const s = sanitizar(meta);
    return `${new Date().toISOString()} [${this.app}] [${nivel}] ${msg}${s !== undefined ? ' ' + JSON.stringify(s) : ''}\n`;
  }
  private async escrever(nivel: string, msg: string, meta?: any) {
    await this.pronto.catch(() => {});
    const l = this.linha(nivel, msg, meta);
    if (this.arquivo) { try { fs.appendFileSync(this.arquivo, l); } catch {} }
    // console apenas como espelho em dev; em prod o arquivo e a fonte.
    if (process.env.NODE_ENV !== 'production') process.stdout.write(l);
  }
  info(msg: string, meta?: any) { return this.escrever('INFO', msg, meta); }
  warn(msg: string, meta?: any) { return this.escrever('WARN', msg, meta); }
  error(msg: string, meta?: any) { return this.escrever('ERROR', msg, meta); }
  async child(contexto: string) { return this; }
}
