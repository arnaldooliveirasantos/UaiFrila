import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export class AuthMiddleware {
  public static verificar = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ erro: 'Token não fornecido' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      (req as any).usuario = decoded;
      (req as any).user = decoded;
      next();
    } catch (e: any) {
      res.status(401).json({ erro: 'Token inválido: ' + e.message });
      return;
    }
  };
}
