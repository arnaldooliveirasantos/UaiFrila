import { Request, Response } from 'express';

export class SSOController {
  public login = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({ erro: 'SSO não implementado' });
  };
}
