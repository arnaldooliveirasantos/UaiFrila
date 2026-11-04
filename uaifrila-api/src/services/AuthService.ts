import { BaseRepository } from '../repositories/BaseRepository';
import { EmailService } from './EmailService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  private pool: any;
  private emailService: EmailService;

  constructor() {
    try {
      const { BaseRepository: BR } = require('../repositories/BaseRepository');
      this.pool = (BR as any).pool || (BR as any).getPool?.();
    } catch {}
    this.emailService = new EmailService();
  }

  private getPool() {
    if (this.pool) return this.pool;
    try {
      const { BaseRepository: BR } = require('../repositories/BaseRepository');
      return (BR as any).pool || (BR as any).getPool?.();
    } catch { return null; }
  }

  private gerarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async cadastro(dados: any) {
    const pool = this.getPool();
    if (!pool) throw new Error('Pool não configurado');
    const { nome, cpf, email, cnpj, nomeFantasia, funcao, valorHora, bio, bairro, endereco, cidade_id, cep, numero, complemento, lat, lng, tipo_chave, temMei, comoChega, ajudaUber } = dados;
    if (!email || !nome || !cpf) throw new Error('nome, cpf e email obrigatórios');
    const emailLower = email.toLowerCase().trim();
    const cpfLimpo = (cpf || '').replace(/\D/g, '');
    const existente = await pool.query(`SELECT id, email, status_usuario_id FROM usuarios WHERE LOWER(email)=LOWER($1) OR cpf=$2 LIMIT 1`, [emailLower, cpfLimpo]);
    let usuarioId: number; let usuario: any;
    if (existente.rows.length > 0) {
      usuarioId = existente.rows[0].id;
      await pool.query(`UPDATE usuarios SET nome_completo=$1, cnpj=$2, nome_fantasia=$3, funcao_principal=$4, valor_hora_base=$5, bio=$6, tem_mei=$7, como_chega=$8, ajuda_uber=$9, atualizado_em=NOW() WHERE id=$10`, [nome, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, temMei || false, comoChega || 'Moto', ajudaUber || 10, usuarioId]);
      usuario = (await pool.query(`SELECT id, nome_completo, email, cpf FROM usuarios WHERE id=$1`, [usuarioId])).rows[0];
      try { await this.salvarEnderecoUsuario(usuarioId, { endereco, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep, numero, complemento, lat, lng }); } catch (e:any) { console.log('[CADASTRO UPDATE] Erro salvar endereco:', e.message); }
    } else {
      const senhaProvisoria = Math.random().toString(36).slice(-8);
      let senhaHash = senhaProvisoria;
      try { senhaHash = await bcrypt.hash(senhaProvisoria, 10); } catch {}
      let tipoUsuarioId = 1; let tipoChaveFinal = tipo_chave || 'FREELA';
      try {
        const tipoRow = await pool.query(`SELECT id, chave FROM tipos_usuario WHERE LOWER(chave)=LOWER($1) LIMIT 1`, [tipo_chave || 'FREELA']);
        if (tipoRow.rows.length > 0) { tipoUsuarioId = tipoRow.rows[0].id; tipoChaveFinal = tipoRow.rows[0].chave; }
      } catch {}
      const res = await pool.query(`INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, funcao_principal, valor_hora_base, bio, tem_mei, como_chega, ajuda_uber, tipo_usuario_id, status_usuario_id, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1,$14) RETURNING id, nome_completo, email, cpf`, [nome, cpfLimpo, emailLower, senhaHash, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, temMei || false, comoChega || 'Moto', ajudaUber || 10, tipoUsuarioId, tipoChaveFinal]);
      usuario = res.rows[0]; usuarioId = usuario.id;
      try { await this.salvarEnderecoUsuario(usuarioId, { endereco, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep, numero, complemento, lat, lng }); } catch (e:any) { console.log('[CADASTRO INSERT] Erro salvar endereco:', e.message); }
    }
    const codigo = this.gerarCodigo();
    console.log(`[AuthService][CADASTRO] ${emailLower} - Código: ***${codigo.slice(-2)} - ID: ${usuarioId}`);
    try {
      await this.emailService.enviarCodigo({ tipo: 'CONFIRMACAO_CADASTRO', email: emailLower, nome, codigo, usuario_id: usuarioId });
    } catch (e: any) { throw new Error(`Falha ao gerar código: ${e.message}`); }
    return { sucesso: false, precisaValidar: true, usuario: { id: usuarioId, nome: usuario.nome_completo, email: usuario.email, cpf: usuario.cpf }, mensagem: 'Código enviado para seu e-mail', tipo: 'cadastro' };
  }

  async salvarEnderecoUsuario(usuarioId: number, dados: any) {
    const pool = this.getPool();
    const { endereco, bairro, cidade_id, cep, numero, complemento, lat, lng } = dados;
    try {
      await pool.query(`UPDATE enderecos_usuario SET is_ativo = false WHERE usuario_id = $1 AND is_ativo = true`, [usuarioId]);
    } catch {}
    const sql = `INSERT INTO enderecos_usuario (usuario_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING id`;
    await pool.query(sql, [usuarioId, endereco || null, bairro || 'Centro', cidade_id || 1, cep || null, numero || null, complemento || null, lat || null, lng || null]);
  }

  async login(dados: { email: string }) {
    const pool = this.getPool();
    let { email } = dados;
    if (!email) throw new Error('E-mail obrigatório');
    email = email.toString().trim().toLowerCase();
    const usuarioRes = await pool.query(`SELECT u.id, u.nome_completo, u.email FROM usuarios u WHERE LOWER(u.email)=LOWER($1) LIMIT 1`, [email]);
    if (usuarioRes.rows.length === 0) throw new Error('Usuário não encontrado - faça cadastro primeiro');
    const usuario = usuarioRes.rows[0];
    const codigo = this.gerarCodigo();
    await this.emailService.enviarCodigo({ tipo: '2FA_LOGIN', email, nome: usuario.nome_completo, codigo, usuario_id: usuario.id });
    return { sucesso: false, precisaValidar: true, mensagem: 'Código enviado para ' + email, tipo: 'login', usuario: { id: usuario.id, email: usuario.email } };
  }

  async validarCodigo(params: { email: string, codigo: string, tipo: string }) {
    const { email, codigo } = params;
    const pool = this.getPool();
    if (!email || !codigo) throw new Error('email e código obrigatórios');

    // Busca apenas EM_ESPERA ou ENVIADO, nunca VALIDADO (fix reuso)
    const res = await pool.query(`
      SELECT h.*, s.chave as status_chave, t.chave_uso as template_chave
      FROM email_historico_disparos h
      JOIN email_status s ON s.id = h.status_id
      JOIN email_templates t ON t.id = h.template_id
      WHERE LOWER(h.email_destinatario) = LOWER($1)
        AND h.codigo_verificacao = $2
        AND s.chave IN ('EM_ESPERA','ENVIADO')
        AND h.expira_em > NOW()
      ORDER BY h.criado_em DESC LIMIT 1
    `, [email.toLowerCase(), codigo]);

    const hist = res.rows[0];
    if (!hist) throw new Error('Código inválido, expirado ou já utilizado');

    // Marca como VALIDADO imediatamente para evitar reuso
    await pool.query(`
      UPDATE email_historico_disparos 
      SET status_id = (SELECT id FROM email_status WHERE chave='VALIDADO'),
          atualizado_em = NOW(),
          ultimo_erro = NULL
      WHERE id = $1
    `, [hist.id]);

    // Busca usuario
    const userRes = await pool.query(`SELECT u.id, u.nome_completo, u.email, u.tipo_usuario_id, tu.chave as tipo_chave FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id WHERE u.id = $1`, [hist.usuario_id]);
    const usuario = userRes.rows[0];
    if (!usuario) throw new Error('Usuário não encontrado');

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET não configurado');
    
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo: usuario.tipo_chave }, jwtSecret, { expiresIn: '7d' });

    // Ativa usuario se estava pendente
    try {
      await pool.query(`UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave='ATIVO' LIMIT 1) WHERE id = $1 AND status_usuario_id = (SELECT id FROM status_usuario WHERE chave='PENDENTE' LIMIT 1)`, [usuario.id]);
    } catch {}

    return { sucesso: true, token, usuario: { id: usuario.id, nome_completo: usuario.nome_completo, email: usuario.email, tipo: usuario.tipo_chave } };
  }

  async reenviarCodigo(params: { email: string, tipo: string }) {
    const pool = this.getPool();
    const userRes = await pool.query(`SELECT id, nome_completo, email FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [params.email]);
    if (userRes.rows.length === 0) throw new Error('Usuário não encontrado');
    const usuario = userRes.rows[0];
    const codigo = this.gerarCodigo();
    const tipo = params.tipo === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN';
    await this.emailService.enviarCodigo({ tipo, email: params.email.toLowerCase(), nome: usuario.nome_completo, codigo, usuario_id: usuario.id });
    return { sucesso: true, mensagem: 'Novo código enviado' };
  }

  async cancelarCadastro(params: { email: string }) {
    const pool = this.getPool();
    await pool.query(`DELETE FROM email_historico_disparos WHERE LOWER(email_destinatario)=LOWER($1) AND status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA')`, [params.email]);
    return { sucesso: true, mensagem: 'Cadastro cancelado' };
  }

  async loginComSenha(email: string, senha: string) {
    const pool = this.getPool();
    const res = await pool.query(`SELECT u.id, u.nome_completo, u.email, u.senha_hash, tu.chave as tipo_chave FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id WHERE LOWER(u.email)=LOWER($1) LIMIT 1`, [email.toLowerCase()]);
    if (res.rows.length === 0) throw new Error('Usuário não encontrado');
    const usuario = res.rows[0];
    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok) throw new Error('Senha incorreta');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET não configurado');
    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo: usuario.tipo_chave }, jwtSecret, { expiresIn: '7d' });
    return { sucesso: true, token, usuario: { id: usuario.id, nome_completo: usuario.nome_completo, email: usuario.email, tipo: usuario.tipo_chave } };
  }
}
