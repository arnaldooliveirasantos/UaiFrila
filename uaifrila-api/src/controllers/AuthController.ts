import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';
import { BaseController, AuthRequest } from './BaseController';
import { BaseRepository } from '../repositories/BaseRepository';

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
      const publico: any = (usuario as any).toPublic ? (usuario as any).toPublic(req.usuario!.id, this.isAdmin(req)) : usuario;
      // ===== Endereços do usuário no /auth/me =====
      // ANTES: buscarPorIdComRelacoes() só fazia SELECT em usuarios + tipo + status.
      // Nunca buscava enderecos, e o toPublic() só removia senha_hash. Por isso o JSON
      // do /auth/me vinha sem enderecos_usuarios, mesmo o usuário tendo endereço cadastrado.
      // AGORA: busca em enderecos (tolerante a coluna ausente) e anexa nos 3 nomes que o front usa:
      // enderecos_usuarios (nome que você pediu), enderecos (alias) e endereco_ativo (o ativo).
      // Se a tabela não existir / query falhar, devolve [] em vez de quebrar o /auth/me.
      let enderecos: any[] = [];
      try {
        const pool: any = (BaseRepository as any).getPool ? (BaseRepository as any).getPool() : null;
        if (pool) {
          try {
            const r = await pool.query(
              `SELECT e.*, c.nome AS cidade_nome, c.estado AS cidade_estado_sigla, c.estado_id
               FROM enderecos e LEFT JOIN cidades c ON c.id = e.cidade_id
               WHERE e.usuario_id = $1 ORDER BY e.ativo DESC NULLS LAST, e.criado_em DESC NULLS LAST, e.id DESC`,
              [req.usuario!.id]
            );
            enderecos = r.rows || [];
          } catch (eJoin: any) {
            // Fallback: sem JOIN (cidades sem cidade_id, coluna diferente, etc.)
            console.warn('[AuthController.me] fallback enderecos sem JOIN:', eJoin.message);
            const r2 = await pool.query(`SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY id DESC`, [req.usuario!.id]);
            enderecos = r2.rows || [];
          }
        }
      } catch (eEnd: any) { console.warn('[AuthController.me] enderecos indisponíveis:', eEnd.message); enderecos = []; }
      const ativo = enderecos.find((e: any) => e.ativo === true || e.ativo === 1) || enderecos[0] || null;
      publico.enderecos_usuarios = enderecos;
      publico.enderecos = enderecos;
      publico.endereco_ativo = ativo;
      // Compat: campos planos que o Perfil já lia (endereco_ativo_cidade / bairro)
      if (ativo) {
        publico.endereco_ativo_id = ativo.id;
        publico.endereco_ativo_cidade = ativo.cidade_nome || ativo.cidade || null;
        publico.endereco_ativo_bairro = ativo.bairro || null;
      }
      console.log(`[AuthController.me] usuario=${req.usuario!.id} enderecos=${enderecos.length} ativo=${ativo?.id || 'nenhum'}`);
      return res.json({ success: true, data: publico });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  // SEM MOCK: esses 3 métodos delegam para os controllers REAIS.
  // ANTES: retornavam { message: 'Código enviado (mock)' } / 'Validado (mock)' -
  // sem gravar código no banco, sem token, sem usuário. O front recebia "sucesso"
  // falso e depois travava no validar (sem token) ou no login (sem código no banco).
  // AGORA: delega para SolicitarCodigoController / ValidarCodigoController.
  // Se o arquivo real não existir, devolve 500 com erro explícito - NUNCA mock.
  private chamarReal = async (arquivo: string, classe: string, metodo: string, req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(`./${arquivo}`);
      const C = mod[classe];
      if (!C) throw new Error(`Controller REAL não encontrado: ${arquivo} não exporta ${classe}. Copie o arquivo para src/controllers/.`);
      const inst = new C();
      const fn = (inst as any)[metodo];
      if (typeof fn !== 'function') throw new Error(`Controller REAL ${classe} não tem método ${metodo}`);
      return fn.call(inst, req, res);
    } catch (e: any) {
      console.error(`[AuthController] FALHOU delegação REAL ${arquivo}.${classe}.${metodo}:`, e.message);
      return res.status(500).json({ success: false, erro: `Login por código indisponível: ${e.message} - copie o controller REAL, não use mock.` });
    }
  };

  solicitarCodigo = async (req: Request, res: Response) => {
    return this.chamarReal('SolicitarCodigoController', 'SolicitarCodigoController', 'solicitarCodigo', req, res);
  };

  validarCodigo = async (req: Request, res: Response) => {
    return this.chamarReal('ValidarCodigoController', 'ValidarCodigoController', 'validarCodigo', req, res);
  };

  reenviarCodigo = async (req: Request, res: Response) => {
    return this.chamarReal('SolicitarCodigoController', 'SolicitarCodigoController', 'reenviarCodigo', req, res);
  };
}
