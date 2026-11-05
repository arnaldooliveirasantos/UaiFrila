import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';

let pool: Pool | null = null;
export function setAuthPool(p: Pool) { pool = p; }

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    tipoUsuarioId: number;
    tipoChave?: string;
    tipo_chave?: string;
    nivelPermissao?: number;
    nivel_permissao?: number;
    isAdmin?: boolean;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: 'Token não fornecido' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Se o token já tem tipoChave e nivel, usa, senão busca do banco para garantir atualização
    let usuario: any = {
      id: decoded.id,
      email: decoded.email,
      tipoUsuarioId: decoded.tipoUsuarioId,
      tipoChave: decoded.tipoChave || decoded.tipo_chave,
      nivelPermissao: decoded.nivelPermissao || decoded.nivel_permissao,
      isAdmin: decoded.isAdmin || false,
    };

    // Sempre busca do banco para ter tipo atualizado (importante quando muda tipo no banco)
    if (pool) {
      try {
        const result = await pool.query(`
          SELECT u.id, u.email, u.tipo_usuario_id, tu.chave as tipo_chave, tu.nivel_permissao
          FROM usuarios u
          LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
          WHERE u.id = $1 LIMIT 1
        `, [decoded.id]);
        if (result.rows && result.rows[0]) {
          const row = result.rows[0];
          usuario = {
            id: row.id,
            email: row.email,
            tipoUsuarioId: row.tipo_usuario_id,
            tipoChave: row.tipo_chave,
            tipo_chave: row.tipo_chave,
            nivelPermissao: row.nivel_permissao,
            nivel_permissao: row.nivel_permissao,
            isAdmin: (row.nivel_permissao || 0) >= 80 || ['ADMIN','SUPER_ADMIN'].includes((row.tipo_chave || '').toUpperCase()),
          };
        }
      } catch (e: any) {
        console.warn('[authMiddleware] Falha ao buscar usuario do banco, usando token', e.message);
      }
    }

    req.usuario = usuario;
    next();
  } catch (e: any) {
    return res.status(401).json({ success: false, message: 'Token inválido: ' + e.message });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header) {
    try {
      const token = header.replace('Bearer ', '');
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).usuario = decoded;
    } catch {}
  }
  next();
}
