import { BaseRepository } from './BaseRepository';

export class AuthRepository extends BaseRepository {

  // Utils
  hashSenha(senha: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(senha || '123456').digest('hex');
  }
  gerarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async garantirStatusUsuario() {
    try {
      await this.query(`SELECT id FROM status_usuario LIMIT 1`);
    } catch {
      try {
        await this.query(`CREATE TABLE IF NOT EXISTS status_usuario (id SERIAL PRIMARY KEY, chave VARCHAR(50) UNIQUE NOT NULL, nome_exibicao VARCHAR(100) NOT NULL, descricao TEXT, cor_hex VARCHAR(20), ordem INT DEFAULT 0, criado_em TIMESTAMP DEFAULT NOW())`);
        await this.query(`INSERT INTO status_usuario (chave, nome_exibicao, descricao, cor_hex, ordem) VALUES ('AGUARDANDO_VALIDACAO', 'Aguardando Validação', 'Usuário cadastrado mas ainda não validou e-mail', '#FFC700', 1), ('ATIVO', 'Ativo', 'Usuário validado e ativo', '#00C851', 2), ('INATIVO', 'Inativo', 'Desativado', '#9E9E9E', 3), ('BLOQUEADO', 'Bloqueado', 'Bloqueado por violação', '#E53935', 4), ('SUSPENSO', 'Suspenso', 'Suspenso temporariamente', '#FF6D00', 5) ON CONFLICT (chave) DO NOTHING`);
      } catch {}
      try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_usuario_id INT`); } catch {}
    }
  }

  async buscarIdStatusPorChave(chave: string): Promise<number> {
    await this.garantirStatusUsuario();
    try {
      const row = await this.queryOne(`SELECT id FROM status_usuario WHERE chave = $1`, [chave.toUpperCase()]);
      if (row) return row.id;
    } catch {}
    const map: any = { 'AGUARDANDO_VALIDACAO': 1, 'ATIVO': 2, 'INATIVO': 3, 'BLOQUEADO': 4, 'SUSPENSO': 5 };
    return map[chave.toUpperCase()] || 1;
  }

  // Busca completa com todos campos incluindo CPF
  async buscarUsuarioPorEmail(email: string) {
    const emailLimpo = email.trim().toLowerCase();
    await this.garantirStatusUsuario();
    try {
      return await this.query(`
        SELECT u.id, u.email, u.nome_completo, u.cpf, u.cnpj, u.nome_fantasia, u.bairro, u.funcao_principal, u.valor_hora_base, u.bio,
               u.is_freela, u.is_contratante, u.is_admin, 
               u.status_usuario_id, su.chave as status_chave, su.nome_exibicao as status_nome, u.criado_em
        FROM usuarios u
        LEFT JOIN status_usuario su ON su.id = u.status_usuario_id
        WHERE LOWER(TRIM(u.email)) = $1
      `, [emailLimpo]);
    } catch (e:any) {
      try {
        return await this.query(`SELECT id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, funcao_principal, valor_hora_base, is_freela, is_contratante, is_admin, status_usuario_id FROM usuarios WHERE LOWER(TRIM(email)) = $1`, [emailLimpo]);
      } catch {
        await this.query(`CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, nome_completo VARCHAR(150), cpf VARCHAR(14), email VARCHAR(150) UNIQUE, senha_hash VARCHAR(255), cnpj VARCHAR(18), nome_fantasia VARCHAR(150), is_freela BOOLEAN DEFAULT FALSE, is_contratante BOOLEAN DEFAULT FALSE, is_admin BOOLEAN DEFAULT FALSE, status_usuario_id INT, status VARCHAR(20), bairro VARCHAR(100), funcao_principal VARCHAR(50), valor_hora_base NUMERIC(10,2), bio TEXT, criado_em TIMESTAMP DEFAULT NOW())`);
        return await this.query(`SELECT id, email, nome_completo, cpf FROM usuarios WHERE LOWER(TRIM(email)) = $1`, [emailLimpo]);
      }
    }
  }

  async buscarUsuarioPorId(id: number) {
    await this.garantirStatusUsuario();
    try {
      return await this.query(`
        SELECT u.id, u.email, u.nome_completo, u.cpf, u.cnpj, u.nome_fantasia, u.bairro, u.funcao_principal, u.valor_hora_base, u.bio,
               u.is_freela, u.is_contratante, u.is_admin, u.status_usuario_id, su.chave as status_chave, u.criado_em
        FROM usuarios u LEFT JOIN status_usuario su ON su.id = u.status_usuario_id WHERE u.id = $1
      `, [id]);
    } catch {
      return await this.query(`SELECT id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, funcao_principal, valor_hora_base, is_freela, is_contratante, is_admin FROM usuarios WHERE id = $1`, [id]);
    }
  }

  async existeUsuarioPorEmail(email: string): Promise<boolean> {
    const rows = await this.buscarUsuarioPorEmail(email);
    return rows.length > 0;
  }

  async listarEmailsDebug() {
    try {
      const rows = await this.query(`SELECT u.id, u.email, u.nome_completo, u.cpf, su.chave as status_chave FROM usuarios u LEFT JOIN status_usuario su ON su.id = u.status_usuario_id ORDER BY u.id DESC LIMIT 10`);
      console.log('📋 USUARIOS NO BANCO:', rows);
      return rows;
    } catch { return []; }
  }

  async criarUsuarioCompleto(dados: any, senhaHash: string) {
    const emailLimpo = dados.email.trim().toLowerCase();
    await this.garantirStatusUsuario();
    const statusId = dados.status_usuario_id || await this.buscarIdStatusPorChave(dados.status_chave || dados.status || 'AGUARDANDO_VALIDACAO');
    try {
      return await this.query(
        `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status_usuario_id, bairro, funcao_principal, valor_hora_base, bio) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
         RETURNING id, email, nome_completo, cpf, cnpj, nome_fantasia, is_freela, is_contratante, status_usuario_id`,
        [dados.nome, dados.cpf, emailLimpo, senhaHash, dados.cnpj, dados.nomeFantasia, !!dados.isFreela, !!dados.isContratante, statusId, dados.bairro || 'Centro', dados.funcao || 'Garçom', dados.valorHora || 20, dados.bio || '']
      );
    } catch (err:any) {
      if (err.code === '23505') return await this.buscarUsuarioPorEmail(emailLimpo);
      return await this.query(`INSERT INTO usuarios (nome_completo, email, senha_hash, status_usuario_id, cpf) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, nome_completo, cpf`, [dados.nome, emailLimpo, senhaHash, statusId, dados.cpf]);
    }
  }

  async ativarUsuarioPorEmail(email: string) {
    const emailLimpo = email.trim().toLowerCase();
    const ativoId = await this.buscarIdStatusPorChave('ATIVO');
    try {
      return await this.query(`UPDATE usuarios SET status_usuario_id = $1 WHERE LOWER(TRIM(email)) = $2 RETURNING id, email, nome_completo, cpf, status_usuario_id`, [ativoId, emailLimpo]);
    } catch {
      return await this.query(`UPDATE usuarios SET status = 'ATIVO' WHERE LOWER(TRIM(email)) = $1 RETURNING id, email, nome_completo`, [emailLimpo]);
    }
  }

  // API que NÃO atualiza CPF nem EMAIL - só demais campos
  async atualizarUsuario(id: number, dados: any) {
    // Lista branca - CPF e EMAIL propositalmente FORA
    const permitidos: any = {
      'nome_completo': dados.nome_completo,
      'cnpj': dados.cnpj,
      'nome_fantasia': dados.nome_fantasia,
      'bairro': dados.bairro,
      'funcao_principal': dados.funcao_principal,
      'valor_hora_base': dados.valor_hora_base,
      'bio': dados.bio,
      'is_freela': dados.is_freela,
      'is_contratante': dados.is_contratante,
    };

    // Regra: se já é DUAL (freela e contratante), não pode voltar para simples
    // Essa validação é feita no service, aqui só atualiza o que vier
    const campos: string[] = [];
    const valores: any[] = [];
    let idx = 1;
    for (const [campo, valor] of Object.entries(permitidos)) {
      if (valor !== undefined) {
        campos.push(`${campo} = $${idx}`);
        valores.push(valor);
        idx++;
      }
    }
    if (campos.length === 0) throw new Error('Nenhum campo permitido para atualizar - CPF e Email são bloqueados');

    valores.push(id);
    const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, funcao_principal, valor_hora_base, bio, is_freela, is_contratante, status_usuario_id`;
    console.log('📝 Atualizando usuario (sem CPF/email):', id, campos);
    try {
      return await this.query(sql, valores);
    } catch (e:any) {
      // fallback sem alguns campos
      const sql2 = `UPDATE usuarios SET nome_completo = $1, bairro = $2 WHERE id = $3 RETURNING *`;
      return await this.query(sql2, [dados.nome_completo, dados.bairro, id]);
    }
  }

  async buscarTempoExpiracao(): Promise<number> {
    try { const rows = await this.query(`SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'`); if (rows[0]) return Number(rows[0].valor); } catch {}
    return 5;
  }
  async existeTemplate(chaveUso: string): Promise<boolean> {
    try { const rows = await this.query(`SELECT id FROM email_templates WHERE chave_uso = $1 LIMIT 1`, [chaveUso]); return rows.length > 0; } catch { return false; }
  }
  async buscarTemplatePorUso(chaveUso: string) {
    return await this.query(`SELECT id, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = $1 LIMIT 1`, [chaveUso]);
  }
  async garantirColunaDadosCadastro() {
    try { await this.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB`); } catch {}
    try { await this.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT`); } catch {}
  }
  async inserirDisparoCadastro(templateId: number, email: string, titulo: string, corpo: string, codigo: string, minutos: number, dadosCadastro: any) {
    const emailLimpo = email.trim().toLowerCase();
    await this.garantirColunaDadosCadastro();
    const usuarioRows = await this.buscarUsuarioPorEmail(emailLimpo);
    const usuarioId = usuarioRows[0]?.id || null;
    try {
      let statusId = null;
      try { const s = await this.queryOne(`SELECT id FROM email_status WHERE chave='EM_ESPERA'`); statusId = s?.id; } catch {}
      if (statusId) {
        return await this.query(`INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em, dados_cadastro) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() + ($8 || ' minutes')::interval, NOW(), $9) RETURNING id`, [templateId, usuarioId, emailLimpo, titulo, corpo, codigo, statusId, minutos, JSON.stringify(dadosCadastro)]);
      } else {
        return await this.query(`INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, expira_em, criado_em, dados_cadastro) VALUES ($1,$2,$3,$4,$5,$6, NOW() + ($7 || ' minutes')::interval, NOW(), $8) RETURNING id`, [templateId, usuarioId, emailLimpo, titulo, corpo, codigo, minutos, JSON.stringify(dadosCadastro)]);
      }
    } catch (e:any) {
      return await this.query(`INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [templateId, emailLimpo, titulo, corpo, codigo]);
    }
  }
  async inserirDisparoLogin(templateId: number, usuarioId: number, email: string, titulo: string, corpo: string, codigo: string, minutos: number) {
    const emailLimpo = email.trim().toLowerCase();
    try {
      let statusId = null;
      try { const s = await this.queryOne(`SELECT id FROM email_status WHERE chave='EM_ESPERA'`); statusId = s?.id; } catch {}
      if (statusId) {
        return await this.query(`INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() + ($8 || ' minutes')::interval, NOW()) RETURNING id`, [templateId, usuarioId, emailLimpo, titulo, corpo, codigo, statusId, minutos]);
      } else {
        return await this.query(`INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, expira_em, criado_em) VALUES ($1,$2,$3,$4,$5,$6, NOW() + ($7 || ' minutes')::interval, NOW()) RETURNING id`, [templateId, usuarioId, emailLimpo, titulo, corpo, codigo, minutos]);
      }
    } catch (e:any) {
      return await this.query(`INSERT INTO email_historico_disparos (template_id, email_destinatario, codigo_verificacao) VALUES ($1,$2,$3) RETURNING id`, [templateId, emailLimpo, codigo]);
    }
  }
  async buscarUltimoDisparoPorEmail(email: string) {
    const emailLimpo = email.trim().toLowerCase();
    try { return await this.query(`SELECT id, codigo_verificacao, expira_em, dados_cadastro, usuario_id FROM email_historico_disparos WHERE LOWER(TRIM(email_destinatario)) = $1 ORDER BY criado_em DESC LIMIT 1`, [emailLimpo]); } catch { return await this.query(`SELECT id, codigo_verificacao, expira_em FROM email_historico_disparos WHERE LOWER(TRIM(email_destinatario)) = $1 ORDER BY criado_em DESC LIMIT 1`, [emailLimpo]); }
  }
  async marcarDisparoValidado(id: number) { 
    try { return await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='VALIDADO') WHERE id = $1`, [id]); } 
    catch { return await this.query(`SELECT 1`); }
  }
  async marcarDisparoExpirado(id: number) { 
    try { return await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO') WHERE id = $1`, [id]); } 
    catch { return await this.query(`SELECT 1`); }
  }
}