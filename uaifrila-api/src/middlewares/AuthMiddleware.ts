import { Request, Response, NextFunction } from 'express';
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
      res.status(401).json({ erro: 'Token não fornecido - Bearer token vazio' });
      return;
    }
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
    req.usuarioId = decoded.id;
    next();
  } catch (e: any) {
    res.status(401).json({ erro: `Token inválido: ${e.message} - verifique JWT_SECRET no .env` });
  }
};
