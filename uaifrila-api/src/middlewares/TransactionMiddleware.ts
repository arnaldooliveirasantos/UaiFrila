import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { txStorage } from '../config/Transaction';
// UMA transacao por chamada a Controller: BEGIN -> handler -> COMMIT | ROLLBACK.
// GETs tambem passam por aqui (transacao read-only implicita, commit ao fim).
// Regra: NENHUM controller/service/repository pode chamar pool.connect()/BEGIN/COMMIT/ROLLBACK.
// Remover os BEGIN manuais de SolicitarCodigoController, ValidarCodigoController e CancelarCadastroController.
export function transactionMiddleware(pool: Pool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).txClient) return next();
    const client = await pool.connect();
    (req as any).txClient = client;
    try { await client.query('BEGIN'); } catch (e) { client.release(); return next(e); }
    let finalizado = false;
    const finalizar = async (ok: boolean) => {
      if (finalizado) return; finalizado = true;
      try { await client.query(ok ? 'COMMIT' : 'ROLLBACK'); } catch {} finally { client.release(); }
    };
    res.on('finish', () => finalizar(res.statusCode < 400));
    res.on('close', () => finalizar(false));
    txStorage.run(client, () => next());
  };
}
