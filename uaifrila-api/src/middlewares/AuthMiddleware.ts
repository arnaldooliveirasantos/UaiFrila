// FILE: uaifrila-api/src/middlewares/AuthMiddleware.ts
// SUBSTITUIR arquivo inteiro

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ erro: 'Token não fornecido - Authorization header obrigatório' });
      return;
    }
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ erro: 'Token vazio' });
      return;
    }
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
    req.usuarioId = decoded.id;
    next();
  } catch (e: any) {
    res.status(401).json({ erro: `Token inválido: ${e.message}` });
  }
};

export const isAdminMiddleware = (req: any, res: Response, next: NextFunction) => {
  const nivel = req.user?.nivel_permissao ?? 0;
  const chave = req.user?.tipo_chave;
  if (nivel < 50 && chave !== 'ADMIN' && chave !== 'SUPER_ADMIN') {
    res.status(403).json({ erro: 'Acesso negado - precisa ser ADMIN (nivel_permissao >=50)' });
    return;
  }
  next();
};

export const isSuperAdminMiddleware = (req: any, res: Response, next: NextFunction) => {
  const nivel = req.user?.nivel_permissao ?? 0;
  const chave = req.user?.tipo_chave;
  if (nivel < 100 && chave !== 'SUPER_ADMIN') {
    res.status(403).json({ erro: 'Acesso negado - SUPER_ADMIN apenas' });
    return;
  }
  next();
};
