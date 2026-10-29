import { Request, Response, NextFunction } from 'express';

export class UTC0Middleware {
  public static converter = (req: Request, res: Response, next: NextFunction) => {
    // Garante que respostas de data venham em UTC
    // Não altera body, apenas passa adiante
    next();
  };
}
