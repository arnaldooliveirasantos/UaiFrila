import jwt from 'jsonwebtoken';
import { pool } from '../config/Database';
// UNICO AuthMiddleware. App.ts NAO define outro.
// JWT_SECRET obrigatorio: sem ele a API nao sobe (antes caia para '' / 'uaifrila-secret-2024').
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET nao definido no .env');
async function carregarUsuario(id: number) {
  const r = await pool.query(`SELECT u.id,u.email,u.tipo_usuario_id,tu.chave AS tipo_chave,tu.nivel_permissao FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id=u.tipo_usuario_id WHERE u.id=$1 LIMIT 1`, [id]);
  return r.rows[0] || null;
}
function montarUsuario(row: any) {
  return { id: row.id, email: row.email, tipoUsuarioId: row.tipo_usuario_id, tipoChave: row.tipo_chave, tipo_chave: row.tipo_chave, nivelPermissao: row.nivel_permissao, nivel_permissao: row.nivel_permissao, isAdmin: (row.nivel_permissao || 0) >= 80 || ['ADMIN','SUPER_ADMIN'].includes((row.tipo_chave || '').toUpperCase()) };
}
export async function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: 'Token nao fornecido' });
  let decoded: any;
  try { decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Token invalido' }); }
  try {
    const row = await carregarUsuario(decoded.id);
    if (!row) return res.status(401).json({ success: false, message: 'Usuario nao encontrado' });
    req.usuario = montarUsuario(row); return next();
  } catch (e) { return next(e); }
}
// Opcional: SEM fallback para payload do token. Sem token -> segue anonimo.
// Com token valido, carrega do banco igual ao authMiddleware; token invalido/usuario inexistente -> segue anonimo (rota publica decide).
export async function optionalAuthMiddleware(req: any, _res: any, next: any) {
  const h = req.headers.authorization;
  if (h) {
    try { const decoded: any = jwt.verify(h.replace('Bearer ', ''), JWT_SECRET); const row = await carregarUsuario(decoded.id); if (row) req.usuario = montarUsuario(row); } catch {}
  }
  next();
}
