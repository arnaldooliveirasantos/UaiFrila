
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

  // ============ CADASTRO ============
  async cadastro(dados: any) {
    const pool = this.getPool();
    if (!pool) throw new Error('Pool não configurado');

    const { nome, cpf, email, cnpj, nomeFantasia, funcao, valorHora, bio, bairro, endereco, endereco_completo, cidade, cidade_id, cidade_nome, lat, lng, endereco_lat, endereco_lng, tipo_chave, temMei, comoChega, ajudaUber } = dados;

    if (!email || !nome || !cpf) throw new Error('nome, cpf e email obrigatórios');

    const emailLower = email.toLowerCase().trim();

    const existente = await pool.query(`SELECT id, email, status_usuario_id FROM usuarios WHERE LOWER(email)=LOWER($1) OR cpf=$2 LIMIT 1`, [emailLower, cpf.replace(/\D/g,'')]);
    
    let usuarioId: number;
    let usuario: any;

    if (existente.rows.length > 0) {
      usuarioId = existente.rows[0].id;
      await pool.query(`
        UPDATE usuarios 
        SET nome_completo=$1, cnpj=$2, nome_fantasia=$3, funcao_principal=$4, valor_hora_base=$5, bio=$6, 
            bairro=$7, endereco_completo=$8, endereco_lat=$9, endereco_lng=$10, cidade_id=$11, cidade_nome=$12,
            tem_mei=$13, como_chega=$14, ajuda_uber=$15, atualizado_em=NOW()
        WHERE id=$16
      `, [nome, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, bairro || 'Centro', endereco_completo || endereco || null, endereco_lat || lat || null, endereco_lng || lng || null, cidade_id || 1, cidade_nome || cidade || 'Uberlândia', temMei || false, comoChega || 'Moto', ajudaUber || 10, usuarioId]);
      
      usuario = (await pool.query(`SELECT id, nome_completo, email, cpf FROM usuarios WHERE id=$1`, [usuarioId])).rows[0];
    } else {
      const senhaProvisoria = Math.random().toString(36).slice(-8);
      let senhaHash = senhaProvisoria;
      try { senhaHash = await bcrypt.hash(senhaProvisoria, 10); } catch {}

      let tipoUsuarioId = 1;
      if (tipo_chave === 'CONTRATANTE') tipoUsuarioId = 2;
      if (tipo_chave === 'DUAL') tipoUsuarioId = 3;

      const res = await pool.query(`
        INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, funcao_principal, valor_hora_base, bio, bairro, endereco_completo, endereco_lat, endereco_lng, cidade_id, cidade_nome, tem_mei, como_chega, ajuda_uber, tipo_usuario_id, status_usuario_id, role)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,1,$20)
        RETURNING id, nome_completo, email, cpf
      `, [nome, cpf.replace(/\D/g,''), emailLower, senhaHash, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, bairro || 'Centro', endereco_completo || endereco || null, endereco_lat || lat || null, endereco_lng || lng || null, cidade_id || 1, cidade_nome || cidade || 'Uberlândia', temMei || false, comoChega || 'Moto', ajudaUber || 10, tipoUsuarioId, tipo_chave || 'FREELA']);

      usuario = res.rows[0];
      usuarioId = usuario.id;
    }

    const codigo = this.gerarCodigo();
    console.log(`[AuthService][CADASTRO] ${emailLower} - Código: ${codigo} - ID: ${usuarioId}`);

    try {
      const emailResult = await this.emailService.enviarCodigo({
        tipo: 'CONFIRMACAO_CADASTRO',
        email: emailLower,
        nome: nome,
        codigo: codigo,
        usuario_id: usuarioId
      });
      console.log(`[AuthService][CADASTRO] Email histórico ID ${emailResult.historicoId} criado - Worker vai enviar`);
    } catch (e: any) {
      console.error(`[AuthService][CADASTRO] Erro email: ${e.message}`);
      throw new Error(`Falha ao gerar código: ${e.message}`);
    }

    return { 
      sucesso: false, // false = precisa validar código
      precisaValidar: true,
      usuario: { id: usuarioId, nome: usuario.nome_completo, email: usuario.email, cpf: usuario.cpf },
      mensagem: 'Código enviado para seu e-mail',
      tipo: 'cadastro'
    };
  }

  // ============ LOGIN SEM SENHA - só email, gera código 2FA_LOGIN ============
  async login(dados: { email: string }) {
    const pool = this.getPool();
    const { email } = dados;

    if (!email) throw new Error('E-mail obrigatório');

    const emailLower = email.toLowerCase().trim();
    console.log(`[AuthService][LOGIN] Solicitado login para ${emailLower}`);

    const usuarioRes = await pool.query(`SELECT id, nome_completo, email, status_usuario_id FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [emailLower]);
    
    if (usuarioRes.rows.length === 0) {
      console.log(`[AuthService][LOGIN] Usuário não encontrado: ${emailLower}`);
      throw new Error('Usuário não encontrado - faça seu cadastro');
    }

    const usuario = usuarioRes.rows[0];

    // Se usuário ainda não validou cadastro (status 1 = pendente), reenvia código de cadastro
    if (usuario.status_usuario_id === 1) {
      console.log(`[AuthService][LOGIN] Usuário pendente, reenviando código de cadastro para ${emailLower}`);
      const codigo = this.gerarCodigo();
      await this.emailService.enviarCodigo({
        tipo: 'CONFIRMACAO_CADASTRO',
        email: emailLower,
        nome: usuario.nome_completo,
        codigo,
        usuario_id: usuario.id
      });
      return {
        sucesso: false,
        precisaValidar: true,
        mensagem: 'Seu cadastro ainda não foi confirmado - enviamos novo código',
        tipo: 'cadastro',
        usuario: { id: usuario.id, email: usuario.email }
      };
    }

    // Login normal - gera código 2FA_LOGIN
    const codigo = this.gerarCodigo();
    console.log(`[AuthService][LOGIN] Gerando código 2FA_LOGIN ${codigo} para ${emailLower}`);

    try {
      const emailResult = await this.emailService.enviarCodigo({
        tipo: '2FA_LOGIN',
        email: emailLower,
        nome: usuario.nome_completo,
        codigo: codigo,
        usuario_id: usuario.id
      });
      console.log(`[AuthService][LOGIN] Email histórico ID ${emailResult.historicoId} criado para login`);
    } catch (e: any) {
      console.error(`[AuthService][LOGIN] Erro email: ${e.message}`);
      throw new Error(`Falha ao enviar código de login: ${e.message}`);
    }

    return {
      sucesso: false,
      precisaValidar: true,
      mensagem: 'Código de login enviado para seu e-mail',
      tipo: 'login',
      usuario: { id: usuario.id, email: usuario.email }
    };
  }

  // ============ LOGIN COM SENHA (LEGADO - opcional) ============
  async loginComSenha(email: string, senha: string) {
    const pool = this.getPool();
    const result = await pool.query(`SELECT id, nome_completo, email, senha_hash, role, tipo_usuario_id FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [email.toLowerCase()]);
    if (result.rows.length === 0) throw new Error('Usuário não encontrado');
    
    const usuario = result.rows[0];
    let senhaValida = false;
    try {
      if (usuario.senha_hash.startsWith('$2')) {
        senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      } else {
        senhaValida = usuario.senha_hash === senha;
      }
    } catch { senhaValida = usuario.senha_hash === senha; }

    if (!senhaValida) throw new Error('Senha inválida');

    const token = jwt.sign({ id: usuario.id, email: usuario.email, role: usuario.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return { sucesso: true, token, usuario: { id: usuario.id, nome: usuario.nome_completo, email: usuario.email, role: usuario.role } };
  }

  // ============ VALIDAR CÓDIGO - tanto cadastro quanto login ============
  async validarCodigo(params: { email: string, codigo: string, tipo: string }) {
    const pool = this.getPool();
    const { email, codigo, tipo } = params;
    
    if (!email || !codigo) throw new Error('email e codigo obrigatórios');

    console.log(`[AuthService][VALIDAR] Código ${codigo} para ${email} tipo ${tipo}`);

    // CORRIGIDO: busca ENVIADO, não EM_ESPERA
    const tipoTemplate = tipo === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN';

    const registro = await pool.query(`
      SELECT h.*, s.chave as status_chave, t.chave_uso as template_chave
      FROM email_historico_disparos h
      JOIN email_status s ON s.id = h.status_id
      JOIN email_templates t ON t.id = h.template_id
      WHERE LOWER(h.email_destinatario) = LOWER($1)
        AND h.codigo_verificacao = $2
        AND h.expira_em > NOW()
        AND s.chave = 'ENVIADO'
        AND t.chave_uso = $3
      ORDER BY h.criado_em DESC
      LIMIT 1
    `, [email.toLowerCase(), codigo, tipoTemplate]);

    // Fallback: se não achou com template exato, tenta sem filtro de template (compatibilidade)
    let hist = registro.rows[0];
    if (!hist) {
      const fallback = await pool.query(`
        SELECT h.*, s.chave as status_chave
        FROM email_historico_disparos h
        JOIN email_status s ON s.id = h.status_id
        WHERE LOWER(h.email_destinatario) = LOWER($1)
          AND h.codigo_verificacao = $2
          AND h.expira_em > NOW()
          AND s.chave = 'ENVIADO'
        ORDER BY h.criado_em DESC LIMIT 1
      `, [email.toLowerCase(), codigo]);
      hist = fallback.rows[0];
    }

    if (!hist) {
      const debug = await pool.query(`
        SELECT h.id, h.codigo_verificacao, s.chave as status, t.chave_uso as template, h.expira_em, NOW() as agora, 
               h.expira_em > NOW() as valido, EXTRACT(EPOCH FROM (h.expira_em - NOW()))/60 as minutos_restantes
        FROM email_historico_disparos h
        JOIN email_status s ON s.id = h.status_id
        JOIN email_templates t ON t.id = h.template_id
        WHERE LOWER(h.email_destinatario) = LOWER($1)
        ORDER BY h.criado_em DESC LIMIT 5
      `, [email.toLowerCase()]);
      console.log(`[AuthService][VALIDAR] Código não encontrado. Últimos:`, debug.rows);
      throw new Error('Código inválido ou expirado - verifique e-mail e tempo (10min)');
    }

    // Marca como VALIDADO
    await pool.query(`
      UPDATE email_historico_disparos 
      SET status_id = (SELECT id FROM email_status WHERE chave='VALIDADO'),
          atualizado_em = NOW()
      WHERE id = $1
    `, [hist.id]);

    // Se for cadastro, ativa usuário
    if (tipo === 'cadastro' || hist.template_chave === 'CONFIRMACAO_CADASTRO') {
      await pool.query(`UPDATE usuarios SET status_usuario_id = 2, atualizado_em = NOW() WHERE LOWER(email) = LOWER($1)`, [email]);
    }

    const usuarioRes = await pool.query(`
      SELECT id, nome_completo, email, cpf, tipo_usuario_id, role,
             CASE tipo_usuario_id 
               WHEN 1 THEN 'FREELA' 
               WHEN 2 THEN 'CONTRATANTE' 
               WHEN 3 THEN 'DUAL' 
               ELSE 'FREELA' 
             END as tipo_chave
      FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1
    `, [email]);
    const usuario = usuarioRes.rows[0];

    if (!usuario) throw new Error('Usuário não encontrado após validação');

    const token = jwt.sign({ id: usuario.id, email: usuario.email, role: usuario.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    console.log(`[AuthService][VALIDAR] Código validado com sucesso para ${email} tipo ${tipo}`);

    return { sucesso: true, token, usuario, tipo };
  }

  async reenviarCodigo(params: { email: string, tipo: string }) {
    const { email, tipo } = params;
    if (!email) throw new Error('email obrigatório');

    const pool = this.getPool();
    const usuarioRes = await pool.query(`SELECT id, nome_completo FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [email.toLowerCase()]);
    if (usuarioRes.rows.length === 0) throw new Error('Usuário não encontrado');

    const usuario = usuarioRes.rows[0];
    const codigo = this.gerarCodigo();

    console.log(`[AuthService][REENVIAR] Código ${codigo} para ${email} tipo ${tipo}`);

    await this.emailService.enviarCodigo({
      tipo: tipo === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN',
      email: email.toLowerCase(),
      nome: usuario.nome_completo,
      codigo,
      usuario_id: usuario.id
    });

    return { sucesso: false, precisaValidar: true, mensagem: 'Novo código enviado', tipo };
  }

  async cancelarCadastro(params: { email: string }) {
    const { email } = params;
    const pool = this.getPool();
    
    await pool.query(`
      UPDATE email_historico_disparos 
      SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em = NOW()
      WHERE LOWER(email_destinatario) = LOWER($1) AND status_id IN (SELECT id FROM email_status WHERE chave IN ('EM_ESPERA','ENVIADO'))
    `, [email]);

    console.log(`[AuthService] Cadastro cancelado para ${email}`);
    return { sucesso: true };
  }
}
