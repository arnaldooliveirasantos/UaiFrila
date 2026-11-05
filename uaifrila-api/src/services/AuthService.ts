import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { EmailHistoricoRepository } from '../repositories/EmailHistoricoRepository';
import { EmailStatusRepository } from '../repositories/EmailStatusRepository';
import { EmailTemplateRepository } from '../repositories/EmailTemplateRepository';
import { BaseService } from './BaseService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET obrigatório no .env');
  return s;
}

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const codigosMemoria = new Map<string, { codigo: string, expira: number, tipo: string }>();

export class AuthService extends BaseService {
  private usuarioRepo: UsuarioRepository;
  private emailHistRepo: EmailHistoricoRepository;
  private emailStatusRepo: EmailStatusRepository;
  private emailTemplateRepo: EmailTemplateRepository;

  constructor() {
    super();
    this.usuarioRepo = new UsuarioRepository();
    this.emailHistRepo = new EmailHistoricoRepository();
    this.emailStatusRepo = new EmailStatusRepository();
    this.emailTemplateRepo = new EmailTemplateRepository();
  }

  async register(dados: any) {
    this.validateRequired(dados, ['nomeCompleto', 'email', 'senha']);
    const existente = await this.usuarioRepo.buscarPorEmail(dados.email);
    if (existente) throw new Error('E-mail já cadastrado');
    const senhaHash = await bcrypt.hash(dados.senha, 10);
    const usuario = await this.usuarioRepo.criarGenerico({
      nomeCompleto: dados.nomeCompleto,
      email: dados.email,
      senhaHash,
      tipoUsuarioId: dados.tipoUsuarioId || 1,
      cpf: dados.cpf,
      cnpj: dados.cnpj,
      statusUsuarioId: 1,
      avaliacaoMedia: 5.0,
      totalAvaliacoes: 0,
    });
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipoUsuarioId: usuario.tipoUsuarioId }, getJwtSecret(), { expiresIn: '7d' });
    return { usuario, token };
  }

  async login(dados: any) {
    this.validateRequired(dados, ['email', 'senha']);
    const usuario = await this.usuarioRepo.buscarPorEmail(dados.email);
    if (!usuario) throw new Error('Credenciais inválidas');
    const raw = usuario.toRaw();
    const senhaHash = raw.senhaHash || raw.senha_hash;
    if (!senhaHash) throw new Error('Usuário sem senha - use código por e-mail');
    const ok = await bcrypt.compare(dados.senha, senhaHash);
    if (!ok) throw new Error('Credenciais inválidas');
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipoUsuarioId: usuario.tipoUsuarioId }, getJwtSecret(), { expiresIn: '7d' });
    return { usuario, token };
  }

  async solicitarCodigo(dados: { email: string, tipo: string }) {
    if (!dados.email) throw new Error('E-mail obrigatório');
    const emailNorm = String(dados.email).trim().toLowerCase();
    console.log(`[AuthService.solicitarCodigo] email=${emailNorm} tipo=${dados.tipo}`);

    if (dados.tipo === 'login') {
      const u = await this.usuarioRepo.buscarPorEmail(emailNorm);
      if (!u) throw new Error('E-mail não cadastrado - faça cadastro');
    }

    const codigo = gerarCodigo();

    try {
      let templateId = null;
      try {
        const tmpl = await this.emailTemplateRepo.buscarPorChave(dados.tipo === 'cadastro' ? 'codigo_cadastro' : 'codigo_login');
        templateId = (tmpl as any)?.id || null;
      } catch {}

      let statusId = null;
      try {
        const st = await this.emailStatusRepo.buscarPorChave('EM_ESPERA');
        statusId = (st as any)?.id || null;
      } catch {}

      await this.emailHistRepo.criarCodigo({
        emailDestinatario: emailNorm,
        templateId,
        statusId,
        codigoVerificacao: codigo,
        tituloFinal: dados.tipo === 'cadastro' ? 'Código de cadastro UaiFrila' : 'Código de acesso UaiFrila',
        conteudoFinal: `<h1>${codigo}</h1>`,
      });
    } catch (e: any) {
      console.warn('[AuthService] Falha ao salvar código no banco, usando memória:', e.message);
    }

    codigosMemoria.set(emailNorm, { codigo, expira: Date.now() + 5 * 60 * 1000, tipo: dados.tipo });
    console.log(`[AuthService] Código para ${emailNorm}: ${codigo}`);

    const isDev = process.env.NODE_ENV !== 'production';
    return { codigo, isDev, message: 'Código enviado' };
  }

  async validarCodigo(dados: { email: string, codigo: string, tipo: string }) {
    if (!dados.email || !dados.codigo) throw new Error('E-mail e código obrigatórios');
    const emailNorm = String(dados.email).trim().toLowerCase();
    const codigoStr = String(dados.codigo).trim();
    console.log(`[AuthService.validarCodigo] ${emailNorm} codigo ${codigoStr}`);

    let valido = false;
    let usuarioIdFromEmail: number | null = null;

    const mem = codigosMemoria.get(emailNorm);
    if (mem && mem.codigo === codigoStr && mem.expira > Date.now()) {
      valido = true;
      codigosMemoria.delete(emailNorm);
    }

    if (!valido) {
      try {
        const row = await this.emailHistRepo.buscarCodigoValido(emailNorm, codigoStr);
        if (row) {
          valido = true;
          usuarioIdFromEmail = (row as any).usuario_id || null;
          try {
            await this.emailHistRepo.marcarComoConsumido((row as any).id);
          } catch {}
        }
      } catch (e: any) {
        console.warn('[AuthService] Erro ao buscar código no banco:', e.message);
      }
    }

    if (!valido) throw new Error('Código inválido ou expirado');

    let usuario = null;
    if (usuarioIdFromEmail) {
      usuario = await this.usuarioRepo.buscarPorIdComRelacoes(usuarioIdFromEmail);
    } else {
      const u = await this.usuarioRepo.buscarPorEmail(emailNorm);
      if (u) usuario = await this.usuarioRepo.buscarPorIdComRelacoes((u as any).id);
    }

    if (!usuario && dados.tipo === 'login') throw new Error('Usuário não encontrado - faça cadastro');
    if (!usuario && dados.tipo === 'cadastro') {
      return { apenasValidado: true, email: emailNorm };
    }
    if (!usuario) throw new Error('Usuário não encontrado');

    const token = jwt.sign({ id: (usuario as any).id, email: (usuario as any).email, tipoUsuarioId: (usuario as any).tipoUsuarioId }, getJwtSecret(), { expiresIn: '7d' });
    return { usuario, token };
  }

  async reenviarCodigo(dados: { email: string, tipo: string }) {
    return this.solicitarCodigo(dados);
  }

  async me(usuarioId: number) {
    const usuario = await this.usuarioRepo.buscarPorIdComRelacoes(usuarioId);
    if (!usuario) throw new Error('Usuário não encontrado');
    return usuario;
  }
}
