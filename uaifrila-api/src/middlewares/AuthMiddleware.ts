import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export class AuthMiddleware {
  public static verificar = (req: Request, res: Response, next: NextFunction) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AuthMiddleware] JWT_SECRET não configurado no .env');
      res.status(500).json({ erro: 'Configuração de servidor ausente: JWT_SECRET' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ erro: 'Token não fornecido' });
      return;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ erro: 'Token vazio' });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      (req as any).usuario = decoded;
      (req as any).user = decoded;
      next();
    } catch (e: any) {
      res.status(401).json({ erro: 'Token inválido ou expirado' });
      return;
    }
  };
}
