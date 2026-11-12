import jwt from 'jsonwebtoken';
import { pool } from '../config/Database';
// UNICO AuthMiddleware. App.ts nao pode ter outro (bug anterior: duplicado com fallback silencioso p/ payload do token).
const JWT_SECRET = process.env.JWT_SECRET || '';
export async function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: 'Token nao fornecido' });
  const token = header.replace('Bearer ', '');
  let decoded: any;
  try { decoded = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Token invalido' }); }
  // SEM fallback p/ payload: se o usuario nao existe no banco, 401. Sem isso um token forjado passava.
  try {
    const r = await pool.query(`SELECT u.id,u.email,u.tipo_usuario_id,tu.chave AS tipo_chave,tu.nivel_permissao FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id=u.tipo_usuario_id WHERE u.id=$1 LIMIT 1`, [decoded.id]);
    if (!r.rows[0]) return res.status(401).json({ success: false, message: 'Usuario nao encontrado' });
    const row = r.rows[0];
    req.usuario = { id: row.id, email: row.email, tipoUsuarioId: row.tipo_usuario_id, tipoChave: row.tipo_chave, tipo_chave: row.tipo_chave, nivelPermissao: row.nivel_permissao, nivel_permissao: row.nivel_permissao, isAdmin: (row.nivel_permissao || 0) >= 80 || ['ADMIN','SUPER_ADMIN'].includes((row.tipo_chave || '').toUpperCase()) };
    return next();
  } catch (e) { return next(e); }
}
export function optionalAuthMiddleware(req: any, _res: any, next: any) {
  const h = req.headers.authorization;
  if (h) { try { req.usuario = jwt.verify(h.replace('Bearer ', ''), JWT_SECRET); } catch {} }
  next();
}
