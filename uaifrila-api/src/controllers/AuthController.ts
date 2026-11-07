import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';
import { EmailService } from '../services/EmailService';
import { BaseController, AuthRequest } from './BaseController';
import { BaseRepository } from '../repositories/BaseRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';
const TEMPO_EXPIRACAO_MIN = 5;
function gerarCodigo(): string { return Math.floor(100000 + Math.random() * 900000).toString(); }
function gerarToken(usuario: any, tipoChave: string, nivel: number, tipoUsuarioId: number) {
  return jwt.sign({ id: usuario.id, email: usuario.email, tipoUsuarioId, tipoChave, tipo_chave: tipoChave, nivelPermissao: nivel, nivel_permissao: nivel, isAdmin: nivel >= 80 || ['ADMIN','SUPER_ADMIN'].includes(String(tipoChave).toUpperCase()) }, JWT_SECRET, { expiresIn: '7d' });
}

export class AuthController extends BaseController {
  private usuarioService: UsuarioService;
  constructor() { super(); this.usuarioService = new UsuarioService(); }
  private getPool() { return BaseRepository.getPool(); }

  register = async (req: Request, res: Response) => {
    try {
      const { nomeCompleto, email, senha, tipoUsuarioId, cpf, cnpj } = req.body;
      if (!nomeCompleto || !email || !senha) return this.error(res, 'Nome, e-mail e senha são obrigatórios', 400);
      const existente = await this.usuarioService.buscarPorEmail(email);
      if (existente) return this.error(res, 'E-mail já cadastrado', 409);
      const senhaHash = await bcrypt.hash(senha, 10);
      const usuario = await this.usuarioService.criar({ nomeCompleto, email, senhaHash, tipoUsuarioId: tipoUsuarioId || 1, cpf, cnpj, statusUsuarioId: 1, avaliacaoMedia: 5.0, totalAvaliacoes: 0 });
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const raw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo;
      const tipoChave = raw?.tipo_chave || raw?.tipoChave || 'FREELA';
      const nivel = raw?.nivel_permissao || raw?.nivelPermissao || 0;
      const token = gerarToken(usuario, tipoChave, nivel, (usuario as any).tipoUsuarioId);
      return res.status(201).json({ success: true, data: { usuario: this.mapToPublic(completo || usuario, { usuario: { id: (usuario as any).id } } as any), token }, token });
    } catch (e: any) { return this.handleError(res, e); }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return this.error(res, 'E-mail e senha obrigatórios', 400);
      const usuario = await this.usuarioService.buscarPorEmail(email);
      if (!usuario) return this.error(res, 'Credenciais inválidas', 401);
      const raw = (usuario as any).toRaw ? (usuario as any).toRaw() : usuario;
      const senhaHash = (raw as any).senhaHash || (raw as any).senha_hash || (usuario as any).senhaHash;
      if (!senhaHash) return this.error(res, 'Este usuário usa login por código', 400);
      const ok = await bcrypt.compare(senha, senhaHash);
      if (!ok) return this.error(res, 'Credenciais inválidas', 401);
      const completo = await this.usuarioService.buscarPorIdComRelacoes((usuario as any).id);
      const compRaw: any = (completo as any)?.toRaw ? (completo as any).toRaw() : completo || raw;
      const tipoChave = compRaw?.tipo_chave || compRaw?.tipoChave || 'FREELA';
      const nivel = compRaw?.nivel_permissao || compRaw?.nivelPermissao || 0;
      const tipoUsuarioId = compRaw?.tipo_usuario_id || compRaw?.tipoUsuarioId || (usuario as any).tipoUsuarioId;
      const token = gerarToken(usuario, tipoChave, nivel, tipoUsuarioId);
      return res.json({ success: true, token, data: { usuario: (completo as any)?.toPublic ? (completo as any).toPublic((usuario as any).id, true) : completo || usuario, token } });
    } catch (e: any) { return this.handleError(res, e); }
  };

  me = async (req: AuthRequest, res: Response) => {
    try {
      const usuario = await this.usuarioService.buscarPorIdComRelacoes(req.usuario!.id);
      if (!usuario) return this.error(res, 'Usuário não encontrado', 404);
      return res.json({ success: true, data: (usuario as any).toPublic ? (usuario as any).toPublic(req.usuario!.id, this.isAdmin(req)) : usuario });
    } catch (e: any) { return this.handleError(res, e); }
  };

  private async solicitarCodigoInterno(req: Request, res: Response, tipoForcado?: 'login' | 'cadastro' | 'reenvio') {
    const { email, tipo } = req.body;
    if (!email) return this.error(res, 'E-mail obrigatório', 400);
    const emailNorm = String(email).trim().toLowerCase();
    const tipoFinal = tipoForcado || (tipo === 'cadastro' ? 'cadastro' : tipo === 'reenvio' ? 'reenvio' : 'login');
    console.log(`[solicitarCodigo] email=${emailNorm} tipo=${tipoFinal}`);
    let usuarioExistente: any = null;
    if (tipoFinal === 'login' || tipoFinal === 'reenvio') {
      usuarioExistente = await this.usuarioService.buscarPorEmail(emailNorm);
      if (!usuarioExistente) return this.error(res, 'E-mail não cadastrado - faça cadastro primeiro', 404);
    } else {
      usuarioExistente = await this.usuarioService.buscarPorEmail(emailNorm).catch(() => null);
    }
    const nomeCompleto = usuarioExistente?.nome_completo || usuarioExistente?.nomeCompleto || usuarioExistente?.nome || 'Uai Frila';
    const primeiroNome = String(nomeCompleto).split(' ')[0] || 'Uai Frila';
    const codigo = gerarCodigo();
    const pool = this.getPool();
    const { titulo, conteudo } = await EmailService.renderizarTemplateCodigo({ email: emailNorm, nome: primeiroNome, codigo, tipo: tipoFinal, tempoExpiracaoMin: TEMPO_EXPIRACAO_MIN });
    const chaveUso = EmailService.chaveUsoParaTipo(tipoFinal);
    console.log(`[solicitarCodigo] codigo gerado=${codigo} template=${chaveUso} para ${emailNorm}`);
    try { await pool.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='EXPIRADO') WHERE LOWER(email_destinatario)=LOWER($1) AND status_id IN (SELECT id FROM email_status WHERE chave IN ('EM_ESPERA','ENVIADO'))`, [emailNorm]); } catch {}
    const templateRes = await pool.query(`SELECT id FROM email_templates WHERE chave_uso=$1 LIMIT 1`, [chaveUso]).catch(() => ({ rows: [] }));
    const templateId = (templateRes as any).rows[0]?.id || null;
    const statusRes = await pool.query(`SELECT id FROM email_status WHERE chave='EM_ESPERA' LIMIT 1`);
    const statusId = statusRes.rows[0]?.id;
    if (!statusId) throw new Error('Status EM_ESPERA não encontrado');
    await pool.query(`INSERT INTO email_historico_disparos (email_destinatario, template_id, status_id, codigo_verificacao, titulo_final, conteudo_final, expira_em, tentativas, criado_em) VALUES ($1,$2,$3,$4,$5,$6, NOW() + INTERVAL '${TEMPO_EXPIRACAO_MIN} minutes', 0, NOW())`, [emailNorm, templateId, statusId, codigo, titulo, conteudo]);
    await EmailService.enviarCodigo({ email: emailNorm, nome: primeiroNome, codigo, tipo: tipoFinal, tempoExpiracaoMin: TEMPO_EXPIRACAO_MIN }).catch((e) => console.error('[solicitarCodigo] falha enviar:', e.message));
    const isDev = process.env.NODE_ENV !== 'production';
    return res.json({ success: true, message: 'Código enviado para seu e-mail', ...(isDev ? { codigo_debug: codigo } : {}) });
  }

  solicitarCodigo = async (req: Request, res: Response) => {
    try { return await this.solicitarCodigoInterno(req, res); } catch (e: any) { console.error('[solicitarCodigo]', e); return this.handleError(res, e); }
  };
  reenviarCodigo = async (req: Request, res: Response) => {
    try { return await this.solicitarCodigoInterno(req, res, 'reenvio'); } catch (e: any) { console.error('[reenviarCodigo]', e); return this.handleError(res, e); }
  };

  // REAL - NÃO É MOCK. Valida no banco, marca CONSUMIDO, devolve token+usuario
  validarCodigo = async (req: Request, res: Response) => {
    try {
      const { email, codigo, tipo } = req.body;
      console.log(`[validarCodigo] email=${email} codigo=${codigo} tipo=${tipo}`);
      if (!email || !codigo) return this.error(res, 'E-mail e código obrigatórios', 400);
      const pool = this.getPool();
      const emailNorm = String(email).trim().toLowerCase();
      const result = await pool.query(`SELECT h.*, u.id as usuario_id FROM email_historico_disparos h LEFT JOIN usuarios u ON LOWER(u.email)=LOWER(h.email_destinatario) WHERE LOWER(h.email_destinatario)=LOWER($1) AND h.codigo_verificacao=$2 AND h.expira_em > NOW() AND h.status_id IN (SELECT id FROM email_status WHERE chave IN ('EM_ESPERA','ENVIADO')) ORDER BY h.criado_em DESC LIMIT 1`, [emailNorm, String(codigo).trim()]);
      console.log(`[validarCodigo] encontrados=${result.rows.length}`);
      if (result.rows.length === 0) {
        // Debug: mostra o que tem no banco para esse email
        const dbg = await pool.query(`SELECT codigo_verificacao, expira_em, status_id FROM email_historico_disparos WHERE LOWER(email_destinatario)=LOWER($1) ORDER BY criado_em DESC LIMIT 3`, [emailNorm]).catch(() => ({ rows: [] }));
        console.log(`[validarCodigo] debug ultimos codigos:`, (dbg as any).rows);
        return this.error(res, 'Código inválido ou expirado - solicite um novo', 400);
      }
      const row = result.rows[0];
      await pool.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='CONSUMIDO'), atualizado_em=NOW() WHERE id=$1`, [row.id]);
      if (!row.usuario_id && tipo === 'login') return this.error(res, 'Usuário não encontrado', 404);
      if (!row.usuario_id && tipo === 'cadastro') return res.json({ success: true, message: 'Código válido - prossiga com cadastro', data: { email: emailNorm } });
      const usuario = await this.usuarioService.buscarPorIdComRelacoes(row.usuario_id);
      if (!usuario) return this.error(res, 'Usuário não encontrado', 404);
      const raw: any = (usuario as any)?.toRaw ? (usuario as any).toRaw() : usuario;
      const tipoChave = raw?.tipo_chave || raw?.tipoChave || 'FREELA';
      const nivel = raw?.nivel_permissao || raw?.nivelPermissao || 0;
      const tipoUsuarioId = raw?.tipo_usuario_id || raw?.tipoUsuarioId || (usuario as any).tipoUsuarioId;
      const token = gerarToken(usuario, tipoChave, nivel, tipoUsuarioId);
      const usuarioPublico = (usuario as any)?.toPublic ? (usuario as any).toPublic((usuario as any).id, true) : usuario;
      console.log(`[validarCodigo] OK usuario=${row.usuario_id} tipo=${tipoChave}`);
      return res.json({ success: true, token, usuario: usuarioPublico, data: { token, usuario: usuarioPublico } });
    } catch (e: any) { console.error('[validarCodigo]', e); return this.handleError(res, e); }
  };
}
