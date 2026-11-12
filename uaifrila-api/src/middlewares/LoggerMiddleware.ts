import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';
import { pool } from '../config/Database';
// Log de TODA request em arquivo (via variaveis_sistema CAMINHO_LOG_API). Sem console.log solto.
const logger = new Logger(pool, 'CAMINHO_LOG_API', 'LOG_PATH_API', 'api');
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const inicio = Date.now();
  res.on('finish', () => { logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, { ms: Date.now() - inicio, usuarioId: (req as any).usuario?.id ?? null }); });
  next();
}
export { logger as apiLogger };
