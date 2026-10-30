
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // POST /auth/cadastro - Cadastro Unificado (gera código CONFIRMACAO_CADASTRO)
  public cadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[AuthController][CADASTRO] Body:', { email: req.body.email, nome: req.body.nome, cpf: req.body.cpf?.substring(0,3)+'***' });
      const result = await this.authService.cadastro(req.body);
      console.log('[AuthController][CADASTRO] OK - precisa validar código');
      res.status(201).json(result);
    } catch (e: any) {
      console.error('[AuthController][CADASTRO] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  // POST /auth/login - Login sem senha (gera código 2FA_LOGIN)
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;
      console.log('[AuthController][LOGIN] Body:', { email, temSenha: !!senha });

      // Se enviou senha, tenta login com senha (legado)
      if (senha) {
        try {
          const result = await this.authService.loginComSenha(email, senha);
          console.log('[AuthController][LOGIN] Login com senha OK');
          res.json(result);
          return;
        } catch (err: any) {
          // Se senha falhou, cai para código
          console.log('[AuthController][LOGIN] Senha falhou, tentando código:', err.message);
        }
      }

      // Login padrão: só email, gera código
      const result = await this.authService.login({ email });
      console.log('[AuthController][LOGIN] Código de login gerado');
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][LOGIN] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  // POST /auth/login-com-senha - Login com senha (separado)
  public loginComSenha = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        res.status(400).json({ erro: 'email e senha obrigatórios' });
        return;
      }
      const result = await this.authService.loginComSenha(email, senha);
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][LOGIN-SENHA] Erro:', e.message);
      res.status(401).json({ erro: e.message });
    }
  };

  // POST /auth/validar-codigo - Valida código de cadastro ou login
  public validarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo, tipo } = req.body;
      console.log('[AuthController][VALIDAR] Body:', { email, codigo, tipo });
      const result = await this.authService.validarCodigo({ email, codigo, tipo });
      console.log('[AuthController][VALIDAR] Código OK');
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][VALIDAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  public reenviarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tipo } = req.body;
      console.log('[AuthController][REENVIAR] Para:', email, tipo);
      const result = await this.authService.reenviarCodigo({ email, tipo });
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][REENVIAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  public cancelarCadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      console.log('[AuthController][CANCELAR] Para:', email);
      const result = await this.authService.cancelarCadastro({ email });
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][CANCELAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };
}
