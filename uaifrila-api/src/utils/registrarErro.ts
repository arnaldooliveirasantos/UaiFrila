import { Logger } from './Logger';
import { pool } from '../config/Database';
// UNICO lugar de log de erro da API. Todo catch chama registrarErro() antes de
// relancar, retornar fallback documentado ou ignorar (ex.: notificacao).
// Nunca lanca, nunca loga dado sensivel (Logger.sanitizar redige codigo/senha/token).
let logger: Logger | null = null;
function getLogger(): Logger { if (!logger) logger = new Logger(pool, 'CAMINHO_LOG_API', 'LOG_PATH_API', 'api'); return logger; }
export function registrarErro(contexto: string, erro: any, meta?: any) {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? 'erro desconhecido');
  const stack = erro instanceof Error ? erro.stack : undefined;
  try { void getLogger().error(contexto, { erro: mensagem, stack: stack?.slice(0, 2000), ...(meta || {}) }); }
  catch { /* log nunca pode quebrar o fluxo */ }
  if (process.env.NODE_ENV !== 'production') console.error(`[${contexto}]`, mensagem);
}
