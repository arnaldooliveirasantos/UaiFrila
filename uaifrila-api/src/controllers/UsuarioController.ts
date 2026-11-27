import { Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';
import { BaseController, AuthRequest } from './BaseController';

export class UsuarioController extends BaseController {
  private service: UsuarioService;
  constructor() {
    super();
    this.service = new UsuarioService();
  }

  // Qualquer autenticado pode listar (mas mascarado)
  listar = async (req: AuthRequest, res: Response) => {
    try {
      const usuarios = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(usuarios, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const usuario = await this.service.buscarPorIdComRelacoes(Number(req.params.id));
      if (!usuario) return this.error(res, 'Usuário não encontrado', 404);
      return res.json({ success: true, data: this.mapToPublic(usuario, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorIdCompleto = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      // Só dono ou admin
      if (req.usuario!.id !== id && !this.isAdmin(req)) {
        return this.error(res, 'Acesso negado: só dono ou admin', 403);
      }
      const usuario = await this.service.buscarPorIdCompleto(id);
      if (!usuario) return this.error(res, 'Usuário não encontrado', 404);
      return res.json({ success: true, data: usuario.toUnmasked() });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      // Só dono ou admin
      if (req.usuario!.id !== id && !this.isAdmin(req)) {
        return this.error(res, 'Só pode atualizar seu próprio perfil', 403);
      }
      const atualizado = await this.service.atualizar(id, req.body);
      return res.json({ success: true, data: this.mapToPublic(atualizado, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['SUPER_ADMIN', 'ADMIN']);
      await this.service.deletar(Number(req.params.id));
      return res.json({ success: true, message: 'Usuário deletado' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarFreelas = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['CONTRATANTE', 'DUAL', 'ADMIN', 'SUPER_ADMIN']);
      const freelas = await this.service.listarComFiltro({ tipoUsuarioId: 1 });
      return res.json({ success: true, data: this.mapListToPublic(freelas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
