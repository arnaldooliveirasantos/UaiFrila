
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

    const { nome, cpf, email, cnpj, nomeFantasia, funcao, valorHora, bio, bairro, endereco, endereco_completo, enderecoCompleto, cidade, cidade_id, cidade_nome, cep, numero, complemento, lat, lng, endereco_lat, endereco_lng, tipo_chave, temMei, comoChega, ajudaUber } = dados;

    if (!email || !nome || !cpf) throw new Error('nome, cpf e email obrigatórios');

    const emailLower = email.toLowerCase().trim();
    const cpfLimpo = (cpf || '').replace(/\D/g, '');

    const existente = await pool.query(`SELECT id, email, status_usuario_id FROM usuarios WHERE LOWER(email)=LOWER($1) OR cpf=$2 LIMIT 1`, [emailLower, cpfLimpo]);
    
    let usuarioId: number;
    let usuario: any;

    if (existente.rows.length > 0) {
      usuarioId = existente.rows[0].id;
      await pool.query(`
        UPDATE usuarios 
        SET nome_completo=$1, cnpj=$2, nome_fantasia=$3, funcao_principal=$4, valor_hora_base=$5, bio=$6, 
            tem_mei=$7, como_chega=$8, ajuda_uber=$9, atualizado_em=NOW()
        WHERE id=$10
      `, [nome, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, temMei || false, comoChega || 'Moto', ajudaUber || 10, usuarioId]);
      
      usuario = (await pool.query(`SELECT id, nome_completo, email, cpf FROM usuarios WHERE id=$1`, [usuarioId])).rows[0];

      // Atualiza endereço em enderecos_usuario (estrutura: endereco VARCHAR(150), bairro, cidade_id, cep, numero, complemento, lat, lng)
      try {
        await this.salvarEnderecoUsuario(usuarioId, { endereco: endereco || endereco_completo || enderecoCompleto || null, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep: cep || null, numero: numero || null, complemento: complemento || null, lat: lat || endereco_lat || null, lng: lng || endereco_lng || null });
      } catch (e:any) { console.log('[CADASTRO UPDATE] Erro salvar endereco:', e.message); }

    } else {
      const senhaProvisoria = Math.random().toString(36).slice(-8);
      let senhaHash = senhaProvisoria;
      try { senhaHash = await bcrypt.hash(senhaProvisoria, 10); } catch {}

      // Busca tipo_usuario_id da tabela tipos_usuario, sem hardcode
      let tipoUsuarioId = 1; // default FREELA
      let tipoChaveFinal = tipo_chave || 'FREELA';
      try {
        const tipoRow = await pool.query(`SELECT id, chave FROM tipos_usuario WHERE LOWER(chave)=LOWER($1) LIMIT 1`, [tipo_chave || 'FREELA']);
        if (tipoRow.rows.length > 0) {
          tipoUsuarioId = tipoRow.rows[0].id;
          tipoChaveFinal = tipoRow.rows[0].chave;
          console.log(`[AuthService][CADASTRO] Tipo encontrado na tabela tipos_usuario: ${tipoChaveFinal} -> ID ${tipoUsuarioId}`);
        } else {
          console.log(`[AuthService][CADASTRO] Tipo ${tipo_chave} não encontrado em tipos_usuario, usando default FREELA ID 1`);
          const defaultTipo = await pool.query(`SELECT id, chave FROM tipos_usuario WHERE LOWER(chave)='freela' LIMIT 1`);
          if (defaultTipo.rows.length > 0) {
            tipoUsuarioId = defaultTipo.rows[0].id;
            tipoChaveFinal = defaultTipo.rows[0].chave;
          }
        }
      } catch (e) {
        console.log(`[AuthService][CADASTRO] Erro ao buscar tipo_usuario, usando default:`, e);
      }

      // INSERT apenas em colunas que existem em usuarios (sem bairro, endereco_completo, cidade_id, etc - esses vão para enderecos_usuario)
      const res = await pool.query(`
        INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, funcao_principal, valor_hora_base, bio, tem_mei, como_chega, ajuda_uber, tipo_usuario_id, status_usuario_id, role)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1,$14)
        RETURNING id, nome_completo, email, cpf
      `, [nome, cpfLimpo, emailLower, senhaHash, cnpj || null, nomeFantasia || null, funcao || 'Garçom', valorHora || 20, bio || null, temMei || false, comoChega || 'Moto', ajudaUber || 10, tipoUsuarioId, tipoChaveFinal]);

      usuario = res.rows[0];
      usuarioId = usuario.id;

      // Salva endereço em enderecos_usuario com estrutura final: endereco VARCHAR(150), bairro, cidade_id, cep, numero, complemento, lat, lng
      try {
        await this.salvarEnderecoUsuario(usuarioId, { endereco: endereco || endereco_completo || enderecoCompleto || null, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep: cep || null, numero: numero || null, complemento: complemento || null, lat: lat || endereco_lat || null, lng: lng || endereco_lng || null });
      } catch (e:any) { console.log('[CADASTRO INSERT] Erro salvar endereco:', e.message); }
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
      sucesso: false,
      precisaValidar: true,
      usuario: { id: usuarioId, nome: usuario.nome_completo, email: usuario.email, cpf: usuario.cpf },
      mensagem: 'Código enviado para seu e-mail',
      tipo: 'cadastro'
    };
  }

  // ============ LOGIN SEM SENHA ============
  async login(dados: { email: string }) {
    const pool = this.getPool();
    let { email } = dados;

    if (!email) throw new Error('E-mail obrigatório');

    email = email.toString().trim().toLowerCase();
    console.log(`[AuthService][LOGIN] Solicitado login para ${email}`);

    if (!email || email.length < 5 || !email.includes('@')) {
      throw new Error('E-mail obrigatório - formato inválido');
    }

    const usuarioRes = await pool.query(`
      SELECT u.id, u.nome_completo, u.email, u.status_usuario_id, u.tipo_usuario_id, u.role,
             tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao, tu.descricao as tipo_descricao
      FROM usuarios u
      LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
      WHERE LOWER(u.email)=LOWER($1) LIMIT 1
    `, [email]);

    if (usuarioRes.rows.length === 0) {
      console.log(`[AuthService][LOGIN] Usuário não encontrado: ${email}`);
      throw new Error('Usuário não encontrado - faça cadastro primeiro');
    }

    const usuario = usuarioRes.rows[0];
    const codigo = this.gerarCodigo();

    console.log(`[AuthService][LOGIN] Código ${codigo} para ${email} usuario ID ${usuario.id}`);

    await this.emailService.enviarCodigo({
      tipo: '2FA_LOGIN',
      email: email,
      nome: usuario.nome_completo,
      codigo,
      usuario_id: usuario.id
    });

    return { sucesso: false, precisaValidar: true, mensagem: 'Código enviado para ' + email, tipo: 'login', usuario: { id: usuario.id, email: usuario.email } };
  }

  async validarCodigo(params: { email: string, codigo: string, tipo: string }) {
    const { email, codigo, tipo } = params;
    const pool = this.getPool();

    if (!email || !codigo) throw new Error('email e código obrigatórios');

    console.log(`[AuthService][VALIDAR] Validando ${email} código ${codigo} tipo ${tipo}`);

    let hist: any = null;
    
    // CORREÇÃO: Busca código válido nos últimos 15 minutos, independente de status (EM_ESPERA ou ENVIADO)
    // Usa NOW() - INTERVAL para dar margem, e não expira antes do tempo
    try {
      const res = await pool.query(`
        SELECT h.*, s.chave as status_chave, t.chave_uso as template_chave, t.chave as template_chave_uso,
               h.expira_em, NOW() as agora_db, EXTRACT(EPOCH FROM (h.expira_em - NOW()))/60 as minutos_restantes,
               h.criado_em, EXTRACT(EPOCH FROM (NOW() - h.criado_em))/60 as minutos_desde_criacao
        FROM email_historico_disparos h
        JOIN email_status s ON s.id = h.status_id
        JOIN email_templates t ON t.id = h.template_id
        WHERE LOWER(h.email_destinatario) = LOWER($1)
          AND h.codigo_verificacao = $2
          AND s.chave IN ('EM_ESPERA', 'ENVIADO', 'VALIDADO')
          AND h.criado_em > NOW() - INTERVAL '15 minutes'
        ORDER BY h.criado_em DESC LIMIT 1
      `, [email.toLowerCase(), codigo]);
      hist = res.rows[0];
      if (hist) {
        console.log(`[VALIDAR] Encontrado: ID ${hist.id} status ${hist.status_chave} criado há ${hist.minutos_desde_criacao ? Number(hist.minutos_desde_criacao).toFixed(1) : '?'}min, expira em ${hist.minutos_restantes ? Number(hist.minutos_restantes).toFixed(1) : '?'}min`);
      }
    } catch (e:any) { console.log('[VALIDAR] Erro query 1:', e.message); }

    // Fallback: busca sem filtro de tempo, só para debug
    if (!hist) {
      try {
        const debugRes = await pool.query(`
          SELECT h.id, h.codigo_verificacao, s.chave as status, t.chave_uso as template, h.expira_em, NOW() as agora, 
                 h.expira_em > NOW() as valido_por_expira, 
                 EXTRACT(EPOCH FROM (h.expira_em - NOW()))/60 as minutos_restantes,
                 EXTRACT(EPOCH FROM (NOW() - h.criado_em))/60 as minutos_desde_criacao,
                 h.criado_em, LOWER(h.email_destinatario) as email_db
          FROM email_historico_disparos h
          JOIN email_status s ON s.id = h.status_id
          JOIN email_templates t ON t.id = h.template_id
          WHERE LOWER(h.email_destinatario) = LOWER($1)
            AND h.codigo_verificacao = $2
          ORDER BY h.criado_em DESC LIMIT 3
        `, [email.toLowerCase(), codigo]);
        console.log(`[VALIDAR] Debug sem filtro tempo:`, debugRes.rows);
        if (debugRes.rows.length > 0) {
          // Se encontrou mas estava expirado por pouco, ainda aceita se criado há menos de 15min
          const candidato = debugRes.rows[0];
          if (candidato.minutos_desde_criacao && Number(candidato.minutos_desde_criacao) < 15) {
            console.log(`[VALIDAR] Código encontrado mas expirado por expira_em, mas criado há ${candidato.minutos_desde_criacao}min < 15min, aceitando com tolerância`);
            hist = candidato;
            // Busca completo
            const full = await pool.query(`SELECT h.*, s.chave as status_chave, t.chave_uso as template_chave FROM email_historico_disparos h JOIN email_status s ON s.id = h.status_id JOIN email_templates t ON t.id = h.template_id WHERE h.id = $1`, [candidato.id]);
            hist = full.rows[0];
          }
        }
      } catch (e:any) { console.log('[VALIDAR] Erro debug:', e.message); }
    }

    if (!hist) {
      const ultimos = await pool.query(`
        SELECT h.id, h.codigo_verificacao, s.chave as status, t.chave_uso as template, h.expira_em, NOW() as agora, 
               h.expira_em > NOW() as valido, EXTRACT(EPOCH FROM (h.expira_em - NOW()))/60 as minutos_restantes,
               EXTRACT(EPOCH FROM (NOW() - h.criado_em))/60 as minutos_desde_criacao
        FROM email_historico_disparos h
        JOIN email_status s ON s.id = h.status_id
        JOIN email_templates t ON t.id = h.template_id
        WHERE LOWER(h.email_destinatario) = LOWER($1)
        ORDER BY h.criado_em DESC LIMIT 5
      `, [email.toLowerCase()]);
      console.log(`[AuthService][VALIDAR] Código não encontrado. Últimos 5 para ${email}:`, ultimos.rows);
      throw new Error('Código inválido ou expirado - verifique e-mail e tempo (10min) - Debug: nenhum código encontrado nos últimos 15min para este e-mail/código');
    }

    // Verifica se já foi usado ou expirado de verdade
    if (hist.status_chave === 'VALIDADO') {
      console.log(`[VALIDAR] Código já usado ID ${hist.id}, permitindo revalidação para gerar token`);
      // Permite revalidar código já validado nos últimos 15min para não travar usuário
    }

    if (hist.status_chave === 'EXPIRADO') {
      const minutos = hist.minutos_desde_criacao ? Number(hist.minutos_desde_criacao).toFixed(1) : '?';
      console.log(`[VALIDAR] Código expirado ID ${hist.id} criado há ${minutos}min`);
      throw new Error(`Código expirado - criado há ${minutos}min, limite 10min - solicite novo código`);
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
      SELECT u.id, u.nome_completo, u.email, u.cpf, u.tipo_usuario_id, u.role,
             tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao, tu.descricao as tipo_descricao
      FROM usuarios u
      LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
      WHERE LOWER(email)=LOWER($1) LIMIT 1
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

  async salvarEnderecoUsuario(usuarioId: number, dados: any) {
    const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
    if (!pool) return;
    try {
      await pool.query(`UPDATE enderecos_usuario SET is_ativo = false, atualizado_em = NOW() WHERE usuario_id = $1 AND is_ativo = true`, [usuarioId]);
    } catch {}
    try {
      // Estrutura final exata: endereco VARCHAR(150), bairro, cidade_id, cep, numero, complemento, lat, lng
      await pool.query(
        `INSERT INTO enderecos_usuario (usuario_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng, is_ativo, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW())`,
        [usuarioId, dados.endereco || null, dados.bairro || 'Centro', dados.cidade_id || 1, dados.cep || null, dados.numero || null, dados.complemento || null, dados.lat || null, dados.lng || null]
      );
      console.log(`[salvarEnderecoUsuario] Endereço salvo para usuario ${usuarioId}: ${dados.endereco || ''} - ${dados.bairro || ''} - CEP ${dados.cep || ''}`);
    } catch (e:any) {
      console.log('[salvarEnderecoUsuario] Erro:', e.message);
      try {
        await pool.query(
          `INSERT INTO enderecos_usuario (usuario_id, bairro, cidade_id, is_ativo, criado_em) VALUES ($1,$2,$3,true,NOW())`,
          [usuarioId, dados.bairro || 'Centro', dados.cidade_id || 1]
        );
      } catch {}
    }
  }

  // Usa VIEW vw_usuarios_com_endereco_ativo
  async buscarUsuarioComEnderecoAtivo(usuarioId: number) {
    try {
      const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
      if (!pool) return null;
      // SEM VIEW - consulta direta
      const res = await pool.query(`
        SELECT 
          u.*, tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao,
          eu.id as endereco_ativo_id, 
          eu.endereco as endereco_ativo_completo,
          eu.bairro as endereco_ativo_bairro, 
          eu.cep as endereco_ativo_cep, 
          eu.numero as endereco_ativo_numero, 
          eu.complemento as endereco_ativo_complemento,
          eu.lat as endereco_ativo_lat, 
          eu.lng as endereco_ativo_lng,
          eu.cidade_id as endereco_ativo_cidade_id,
          c.nome as endereco_ativo_cidade, 
          c.estado as endereco_ativo_estado,
          c.estado_id as endereco_ativo_estado_id,
          e.sigla as endereco_ativo_estado_sigla,
          e.nome as endereco_ativo_estado_nome,
          e.id as estado_id_real,
          -- compatibilidade
          eu.endereco as endereco_completo,
          eu.bairro as bairro,
          eu.cep as cep,
          eu.numero as numero,
          eu.complemento as complemento,
          c.id as cidade_id,
          c.nome as cidade_nome,
          e.sigla as estado,
          e.sigla as uf,
          e.id as estado_id
        FROM usuarios u
        LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
        LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
        LEFT JOIN cidades c ON c.id = eu.cidade_id
        LEFT JOIN estados e ON e.id = c.estado_id OR UPPER(e.sigla) = UPPER(c.estado)
        WHERE u.id = $1
        ORDER BY eu.criado_em DESC LIMIT 1
      `, [usuarioId]);
      return res.rows[0] || null;
    } catch (e:any) {
      console.log('[buscarUsuarioComEnderecoAtivo SEM VIEW] Erro:', e.message);
      return null;
    }
  }

  async buscarUsuarioComEnderecoPorEmail(email: string) {
    try {
      const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
      if (!pool) return null;
      const res = await pool.query(`
        SELECT u.*, tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome,
          eu.id as endereco_ativo_id, eu.endereco as endereco_ativo_completo,
          eu.bairro as endereco_ativo_bairro, eu.cep as endereco_ativo_cep,
          eu.numero as endereco_ativo_numero, eu.complemento as endereco_ativo_complemento,
          c.nome as endereco_ativo_cidade, c.estado as endereco_ativo_estado,
          e.sigla as endereco_ativo_estado_sigla, e.id as estado_id_real
        FROM usuarios u
        LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
        LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
        LEFT JOIN cidades c ON c.id = eu.cidade_id
        LEFT JOIN estados e ON e.id = c.estado_id OR UPPER(e.sigla)=UPPER(c.estado)
        WHERE LOWER(u.email) = LOWER($1) LIMIT 1
      `, [email]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }
}
