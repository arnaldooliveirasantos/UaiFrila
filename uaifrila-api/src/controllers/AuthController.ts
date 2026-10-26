import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  public registrar = async (req: Request, res: Response): Promise<void> => {
    try {
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
      res.status(200).json(result);
    } catch (e: any) {
      console.error('🔥 ERRO LOGIN:', e);
      const status = e.message.includes('não encontrado') ? 401 : 500;
      res.status(status).json({ erro: e.message });
    }
  };

  public buscarMe = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) { res.status(401).json({ erro: 'Não autenticado' }); return; }
      const usuario = await this.authService.buscarMe(userId);
      res.status(200).json({ usuario });
    } catch (e: any) {
      res.status(404).json({ erro: e.message });
    }
  };

  public atualizarUsuario = async (req: any, res: Response): Promise<void> => {
    try {
      const userIdParam = Number(req.params.id);
      const userIdToken = req.user?.id;
      const nivel = req.user?.nivel_permissao || 0;
      if (userIdParam !== userIdToken && nivel < 80) {
        res.status(403).json({ erro: 'Sem permissão para editar outro usuário' }); return;
      }
      // Bloqueia CPF e EMAIL explicitamente
      if (req.body.cpf || req.body.email) {
        console.log('🚫 API bloqueou tentativa de atualizar CPF/EMAIL');
        delete req.body.cpf;
        delete req.body.email;
      }
      const usuario = await this.authService.atualizarUsuario(userIdParam, req.body, req.user);
      res.status(200).json({ sucesso: true, usuario });
    } catch (e: any) {
      console.error('Erro atualizar usuario:', e);
      res.status(400).json({ erro: e.message });
    }
  };

  public verificarToken2FA = async (req: Request, res: Response): Promise<void> => {
    return this.verificarTokenEmail(req, res);
  };

  public listarTiposUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipos = await this.authService.listarTiposUsuario();
      res.status(200).json({ tipos });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };


  public reenviarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tipo } = req.body;
      const result = await this.authService.reenviarCodigo(email, tipo || 'cadastro');
      res.status(200).json(result);
    } catch (e: any) {
      console.error('🔥 ERRO REENVIAR CODIGO:', e);
      res.status(400).json({ erro: e.message });
    }
  };

  public verificarTokenEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo } = req.body;
      const result = await this.authService.verificarCodigo(email, codigo);
      res.status(200).json(result);
    } catch (e: any) {
      const status = e.message.includes('Código') || e.message.includes('Nenhum código') ? 400 : 500;
      res.status(status).json({ erro: e.message });
    }
  };
}