import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';
import { EnderecoService } from '../services/EnderecoService';
import { BaseController, AuthRequest } from './BaseController';
import { SolicitarCodigoController } from './SolicitarCodigoController';
import { ValidarCodigoController } from './ValidarCodigoController';
// CORRIGIDO: me() usava BaseRepository.getPool().query direto para buscar enderecos.
// Agora usa EnderecoService.listarBrutosPorUsuario (repository, sem pool no controller).
// CORRIGIDO: solicitar/validar/reenviar codigo usavam require() dinamico para chamar os
// controllers reais. Agora importam direto — mesmo comportamento, sem require.
const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';
export class AuthController extends BaseController {
  private usuarioService: UsuarioService;
  private enderecoService: EnderecoService;
  private solicitarCtrl = new SolicitarCodigoController();
  private validarCtrl = new ValidarCodigoController();
  constructor() {
    super();
    this.usuarioService = new UsuarioService();
    this.enderecoService = new EnderecoService();
  }
  register = async (req: Request, res: Response) => {
    try {
      const { nomeCompleto, email, senha, tipoUsuarioId, cpf, cnpj } = req.body;
      if (!nomeCompleto || !email || !senha) return this.error(res, 'Nome, e-mail e senha sao obrigatorios', 400);
      const existente = await this.usuarioService.buscarPorEmail(email);
      if (existente) return this.error(res, 'E-mail ja cadastrado', 409);
      const senhaHash = await bcrypt.hash(senha, 10);
      const usuario = await this.usuarioService.criar({
        nomeCompleto, email, senhaHash, tipoUsuarioId: tipoUsuarioId || 1, cpf, cnpj,
        statusUsuarioId: 1, avaliacaoMedia: 5.0, totalAvaliacoes: 0,
      });
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const raw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo;
      const tipoChave = raw?.tipo_chave || raw?.tipoChave || 'FREELA';
      const nivel = raw?.nivel_permissao || raw?.nivelPermissao || 0;
      const token = jwt.sign(
        { id: (usuario as any).id, email: (usuario as any).email,
          tipoUsuarioId: (usuario as any).tipoUsuarioId || (usuario as any).tipo_usuario_id,
          tipoChave, tipo_chave: tipoChave, nivelPermissao: nivel, nivel_permissao: nivel,
          isAdmin: nivel >= 80 || ['ADMIN', 'SUPER_ADMIN'].includes(tipoChave.toUpperCase()) },
        JWT_SECRET, { expiresIn: '7d' }
      );
      return res.status(201).json({
        success: true,
        data: { usuario: this.mapToPublic(completo || usuario, { usuario: { id: (usuario as any).id } } as any), token },
      });
    } catch (e: any) { return this.handleError(res, e); }
  };
  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return this.error(res, 'E-mail e senha obrigatorios', 400);
      const usuario = await this.usuarioService.buscarPorEmail(email);
      if (!usuario) return this.error(res, 'Credenciais invalidas', 401);
      const raw = (usuario as any).toRaw ? (usuario as any).toRaw() : usuario;
      const senhaHash = (raw as any).senhaHash || (raw as any).senha_hash || (usuario as any).senhaHash;
      const ok = await bcrypt.compare(senha, senhaHash);
      if (!ok) return this.error(res, 'Credenciais invalidas', 401);
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const compRaw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo || raw;
      const tipoChave = compRaw?.tipo_chave || compRaw?.tipoChave || (raw as any).tipo_chave || 'FREELA';
      const nivel = compRaw?.nivel_permissao || compRaw?.nivelPermissao || (raw as any).nivel_permissao || 0;
      const tipoUsuarioId = compRaw?.tipo_usuario_id || compRaw?.tipoUsuarioId || (usuario as any).tipoUsuarioId;
      const token = jwt.sign(
        { id: (usuario as any).id, email: (usuario as any).email, tipoUsuarioId,
          tipoChave, tipo_chave: tipoChave, nivelPermissao: nivel, nivel_permissao: nivel,
          isAdmin: nivel >= 80 || ['ADMIN', 'SUPER_ADMIN'].includes(tipoChave.toUpperCase()) },
        JWT_SECRET, { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        data: {
          usuario: (completo as any)?.toPublic ? (completo as any).toPublic((usuario as any).id, true) : completo || usuario,
          token,
        },
      });
    } catch (e: any) { return this.handleError(res, e); }
  };
  me = async (req: AuthRequest, res: Response) => {
    try {
      const usuario = await this.usuarioService.buscarPorIdComRelacoes(req.usuario!.id);
      if (!usuario) return this.error(res, 'Usuario nao encontrado', 404);
      const publico: any = (usuario as any).toPublic ? (usuario as any).toPublic(req.usuario!.id, this.isAdmin(req)) : usuario;
      // Enderecos via service (antes: pool.query direto aqui no controller).
      // listarBrutosPorUsuario devolve as linhas cruas (snake_case) com cidade_nome,
      // nos 3 nomes que o front usa: enderecos_usuarios, enderecos, endereco_ativo.
      let enderecos: any[] = [];
      try { enderecos = await this.enderecoService.listarBrutosPorUsuario(req.usuario!.id); }
      catch (eEnd: any) { console.warn('[AuthController.me] enderecos indisponiveis:', eEnd.message); enderecos = []; }
      const ativo = enderecos.find((e: any) => e.ativo === true || e.ativo === 1) || enderecos[0] || null;
      // Cidade aninhada a partir do JOIN (cidade_nome / cidade_estado_sigla / estado_id).
      // O front le end.cidade.estadoId — caminho unico, sem fallback.
      const comCidade = (e: any) => e ? { ...e, cidade: { id: e.cidade_id, nome: e.cidade_nome, estado: e.cidade_estado_sigla, estadoId: e.estado_id } } : e;
      publico.enderecos_usuarios = enderecos.map(comCidade);
      publico.enderecos = enderecos.map(comCidade);
      publico.endereco_ativo = comCidade(ativo);
      if (ativo) {
        publico.endereco_ativo_id = ativo.id;
        publico.endereco_ativo_cidade = ativo.cidade_nome || ativo.cidade || null;
        publico.endereco_ativo_bairro = ativo.bairro || null;
      }
      return res.json({ success: true, data: publico });
    } catch (e: any) { return this.handleError(res, e); }
  };
  // Login por codigo delega para os controllers reais (sem mock, sem require).
  solicitarCodigo = async (req: Request, res: Response) => {
    return this.solicitarCtrl.solicitarCodigo(req, res);
  };
  validarCodigo = async (req: Request, res: Response) => {
    return this.validarCtrl.validarCodigo(req, res);
  };
  reenviarCodigo = async (req: Request, res: Response) => {
    return this.solicitarCtrl.reenviarCodigo(req, res);
  };
}
