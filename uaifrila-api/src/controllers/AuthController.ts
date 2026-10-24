import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  public registrar = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📥 REGISTRAR payload:', { nome: req.body.nome, email: req.body.email, cpf: req.body.cpf, bairro: req.body.bairro });
      const result = await this.authService.registrar(req.body);
      if ((result as any).sucesso) res.status(201).json(result);
      else res.status(200).json(result);
    } catch (e: any) {
      console.error('🔥 ERRO REGISTRAR:', e);
      const status = e.message.includes('já cadastrado') ? 400 : 500;
      res.status(status).json({ erro: e.message });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.authService.login(email);
      if ((result as any).sucesso) res.status(200).json(result);
      else res.status(200).json(result);
    } catch (e: any) {
      console.error('🔥 ERRO LOGIN:', e);
      const status = e.message.includes('não encontrado') ? 401 : 500;
      res.status(status).json({ erro: e.message });
    }
  };

  public verificarToken2FA = async (req: Request, res: Response): Promise<void> => {
    return this.verificarTokenEmail(req, res);
  };

  public verificarTokenEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo } = req.body;
      console.log('🔍 Verificando código', email, codigo);
      const result = await this.authService.verificarCodigo(email, codigo);
      res.status(200).json(result);
    } catch (e: any) {
      console.error('🔥 ERRO VERIFICAR:', e);
      const status = e.message.includes('Código') || e.message.includes('Nenhum código') ? 400 : 500;
      res.status(status).json({ erro: e.message });
    }
  };
}