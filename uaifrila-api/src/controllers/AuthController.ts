import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';
import { BaseController, AuthRequest } from './BaseController';

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';

export class AuthController extends BaseController {
  private usuarioService: UsuarioService;

  constructor() {
    super();
    this.usuarioService = new UsuarioService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { nomeCompleto, email, senha, tipoUsuarioId, cpf, cnpj } = req.body;

      if (!nomeCompleto || !email || !senha) {
        return this.error(res, 'Nome, e-mail e senha são obrigatórios', 400);
      }

      const existente = await this.usuarioService.buscarPorEmail(email);
      if (existente) return this.error(res, 'E-mail já cadastrado', 409);

      const senhaHash = await bcrypt.hash(senha, 10);

      const usuario = await this.usuarioService.criar({
        nomeCompleto,
        email,
        senhaHash,
        tipoUsuarioId: tipoUsuarioId || 1,
        cpf,
        cnpj,
        statusUsuarioId: 1,
        avaliacaoMedia: 5.0,
        totalAvaliacoes: 0,
      });

      // Busca completo para pegar tipo chave e nivel
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const raw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo;
      const tipoChave = raw?.tipo_chave || raw?.tipoChave || 'FREELA';
      const nivel = raw?.nivel_permissao || raw?.nivelPermissao || 0;

      const token = jwt.sign(
        { 
          id: (usuario as any).id, 
          email: (usuario as any).email, 
          tipoUsuarioId: (usuario as any).tipoUsuarioId || (usuario as any).tipo_usuario_id,
          tipoChave,
          tipo_chave: tipoChave,
          nivelPermissao: nivel,
          nivel_permissao: nivel,
          isAdmin: nivel >= 80 || ['ADMIN','SUPER_ADMIN'].includes(tipoChave.toUpperCase())
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        data: {
          usuario: this.mapToPublic(completo || usuario, { usuario: { id: (usuario as any).id } } as any),
          token,
        },
      });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return this.error(res, 'E-mail e senha obrigatórios', 400);

      const usuario = await this.usuarioService.buscarPorEmail(email);
      if (!usuario) return this.error(res, 'Credenciais inválidas', 401);

      const raw = (usuario as any).toRaw ? (usuario as any).toRaw() : usuario;
      const senhaHash = (raw as any).senhaHash || (raw as any).senha_hash || (usuario as any).senhaHash;
      const ok = await bcrypt.compare(senha, senhaHash);
      if (!ok) return this.error(res, 'Credenciais inválidas', 401);

      // Busca completo para ter tipo_chave e nivel_permissao atualizados do banco
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const compRaw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo || raw;
      
      const tipoChave = compRaw?.tipo_chave || compRaw?.tipoChave || (raw as any).tipo_chave || 'FREELA';
      const nivel = compRaw?.nivel_permissao || compRaw?.nivelPermissao || (raw as any).nivel_permissao || 0;
      const tipoUsuarioId = compRaw?.tipo_usuario_id || compRaw?.tipoUsuarioId || (usuario as any).tipoUsuarioId;

      console.log(`[Auth login] ${email} -> tipo ${tipoChave} nivel ${nivel} tipoUsuarioId ${tipoUsuarioId}`);

      const token = jwt.sign(
        { 
          id: (usuario as any).id, 
          email: (usuario as any).email, 
          tipoUsuarioId,
          tipoChave,
          tipo_chave: tipoChave,
          nivelPermissao: nivel,
          nivel_permissao: nivel,
          isAdmin: nivel >= 80 || ['ADMIN','SUPER_ADMIN'].includes(tipoChave.toUpperCase())
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        data: {
          usuario: (completo as any)?.toPublic ? (completo as any).toPublic((usuario as any).id, true) : completo || usuario,
          token,
        },
      });
    } catch (e: any) {
      console.error('[Auth login] erro', e);
      return this.handleError(res, e);
    }
  };

  me = async (req: AuthRequest, res: Response) => {
    try {
      const usuario = await this.usuarioService.buscarPorIdComRelacoes(req.usuario!.id);
      if (!usuario) return this.error(res, 'Usuário não encontrado', 404);
      return res.json({ success: true, data: (usuario as any).toPublic ? (usuario as any).toPublic(req.usuario!.id, this.isAdmin(req)) : usuario });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  solicitarCodigo = async (req: Request, res: Response) => {
    try {
      // Se não tem implementação, retorna mock para não quebrar
      return res.json({ success: true, message: 'Código enviado (mock)' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  validarCodigo = async (req: Request, res: Response) => {
    try {
      return res.json({ success: true, message: 'Validado (mock)' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  reenviarCodigo = async (req: Request, res: Response) => {
    try {
      return res.json({ success: true, message: 'Reenviado (mock)' });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
