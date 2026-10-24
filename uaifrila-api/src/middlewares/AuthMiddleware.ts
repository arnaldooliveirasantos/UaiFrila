import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('❌ Sem Authorization header em', req.path);
    return res.status(401).json({ erro: 'Token não fornecido - faça login' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    console.log('✅ Token válido para usuario:', decoded.email, 'status_usuario_id:', decoded.status_usuario_id);
    
    // Se usuario ainda está AGUARDANDO_VALIDACAO, bloqueia acesso ao mural mas permite validar
    if (decoded.status_usuario_id === 1) {
      // Permite apenas rotas de validação
      if (req.path.includes('/verificar') || req.path.includes('/validar')) {
        req.user = decoded;
        return next();
      }
      console.log('⚠️ Usuario com status AGUARDANDO_VALIDACAO tentando acessar', req.path);
      return res.status(401).json({ 
        erro: 'Usuário aguardando validação - valide seu e-mail', 
        status_usuario_id: 1,
        status_chave: 'AGUARDANDO_VALIDACAO',
        precisa_validar: true
      });
    }

    req.user = decoded;
    next();
  } catch (e:any) {
    console.log('❌ Token inválido:', e.message, 'token:', token.substring(0,20));
    return res.status(401).json({ erro: 'Token inválido ou expirado', detalhe: e.message });
  }
}

// Middleware opcional - não bloqueia, apenas decodifica se tiver token
export function authOpcionalMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      req.user = decoded;
    } catch {}
  }
  next();
}