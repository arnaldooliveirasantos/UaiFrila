import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';

export interface AuthRequest extends Request { usuario?: any; }

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    console.warn(`[authMiddleware] 401 sem token: ${req.method} ${req.path}`);
    return res.status(401).json({ success: false, message: 'Token não informado - faça login' });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Normaliza id para number - se vier NaN, o backend quebra nas queries
    const id = Number(decoded.id);
    if (!Number.isFinite(id)) {
      console.warn(`[authMiddleware] 401 token com id inválido:`, decoded);
      return res.status(401).json({ success: false, message: 'Token inválido - faça login novamente' });
    }
    req.usuario = { ...decoded, id };
    next();
  } catch (e: any) {
    console.warn(`[authMiddleware] 401 token inválido/expirado: ${req.method} ${req.path} - ${e.message}`);
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado - faça login novamente' });
  }
}

// Para rotas públicas que PODEM ter token (mural): não bloqueia se não tiver token
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next();
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.usuario = { ...decoded, id: Number(decoded.id) };
  } catch { /* ignora token inválido em rota pública */ }
  next();
}
