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
        SELECT u.id, u.email, u.nome_completo, u.cpf, u.cnpj, u.nome_fantasia, u.bairro, u.endereco_completo, u.endereco_lat, u.endereco_lng, u.cidade_id, u.cidade_nome, u.funcao_principal, u.valor_hora_base, u.bio,
               u.is_freela, u.is_contratante, u.is_admin, 
               u.status_usuario_id, su.chave as status_chave, su.nome_exibicao as status_nome, u.criado_em
        FROM usuarios u
        LEFT JOIN status_usuario su ON su.id = u.status_usuario_id
        WHERE LOWER(TRIM(u.email)) = $1
      `, [emailLimpo]);
    } catch (e:any) {
      try {
        return await this.query(`SELECT id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, endereco_completo, cidade_nome, funcao_principal, valor_hora_base, is_freela, is_contratante, is_admin, status_usuario_id FROM usuarios WHERE LOWER(TRIM(email)) = $1`, [emailLimpo]);
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
        SELECT u.id, u.email, u.nome_completo, u.cpf, u.cnpj, u.nome_fantasia, u.bairro, u.endereco_completo, u.endereco_lat, u.endereco_lng, u.cidade_id, u.cidade_nome, u.funcao_principal, u.valor_hora_base, u.bio,
               u.is_freela, u.is_contratante, u.is_admin, u.status_usuario_id, su.chave as status_chave, u.criado_em
        FROM usuarios u LEFT JOIN status_usuario su ON su.id = u.status_usuario_id WHERE u.id = $1
      `, [id]);
    } catch {
      return await this.query(`SELECT id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, endereco_completo, endereco_lat, endereco_lng, cidade_id, cidade_nome, funcao_principal, valor_hora_base, is_freela, is_contratante, is_admin FROM usuarios WHERE id = $1`, [id]);
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
    await this.garantirColunasEndereco();
    try {
      const usuarioCriado = await this.query(
        `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status_usuario_id, bairro, endereco_completo, endereco_lat, endereco_lng, cidade_id, cidade_nome, funcao_principal, valor_hora_base, bio) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) 
         RETURNING id, email, nome_completo, cpf, cnpj, nome_fantasia, is_freela, is_contratante, status_usuario_id, endereco_completo, cidade_nome`,
        [dados.nome, dados.cpf, emailLimpo, senhaHash, dados.cnpj, dados.nomeFantasia, !!dados.isFreela, !!dados.isContratante, statusId, dados.bairro || dados.cidade_nome || 'Centro', dados.endereco || dados.endereco_completo || dados.bairro, dados.lat || dados.endereco_lat, dados.lng || dados.endereco_lng, dados.cidade_id, dados.cidade_nome || dados.cidade || 'Uberlândia', dados.funcao || 'Garçom', dados.valorHora || 20, dados.bio || '']
      );
      // Cria na nova tabela enderecos_usuario como ativo
      try {
        await this.garantirTabelaEnderecosUsuario();
        const uid = usuarioCriado[0]?.id;
        if (uid && (dados.endereco || dados.endereco_completo)) {
          await this.query(`INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`, [uid, dados.endereco || dados.endereco_completo, dados.bairro || dados.cidade_nome || 'Centro', dados.cidade_id, dados.cidade_nome || dados.cidade || 'Uberlândia', dados.lat || dados.endereco_lat, dados.lng || dados.endereco_lng]);
        }
      } catch {}
      return usuarioCriado;
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

  // API que NÃO atualiza CPF nem EMAIL - só demais campos - AGORA COM ENDEREÇO
  async atualizarUsuario(id: number, dados: any) {
    await this.garantirColunasEndereco();
    // Lista branca - CPF e EMAIL propositalmente FORA - bairro mantido por compatibilidade mas preferimos endereco
    const permitidos: any = {
      'nome_completo': dados.nome_completo,
      'cnpj': dados.cnpj,
      'nome_fantasia': dados.nome_fantasia,
      'bairro': dados.bairro,
      'endereco_completo': dados.endereco_completo || dados.endereco,
      'endereco_lat': dados.endereco_lat || dados.lat,
      'endereco_lng': dados.endereco_lng || dados.lng,
      'cidade_id': dados.cidade_id,
      'cidade_nome': dados.cidade_nome || dados.cidade,
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
    const sql = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, email, nome_completo, cpf, cnpj, nome_fantasia, bairro, endereco_completo, endereco_lat, endereco_lng, cidade_id, cidade_nome, funcao_principal, valor_hora_base, bio, is_freela, is_contratante, status_usuario_id`;
    console.log('📝 Atualizando usuario (sem CPF/email):', id, campos);
    try {
      return await this.query(sql, valores);
    } catch (e:any) {
      // fallback sem alguns campos
      const sql2 = `UPDATE usuarios SET nome_completo = $1, bairro = $2 WHERE id = $3 RETURNING *`;
      return await this.query(sql2, [dados.nome_completo, dados.bairro, id]);
    }
  }


  async garantirColunasEndereco() {
    try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_completo TEXT`); } catch {}
    try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_lat DOUBLE PRECISION`); } catch {}
    try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_lng DOUBLE PRECISION`); } catch {}
    try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade_id INT`); } catch {}
    try { await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade_nome VARCHAR(100)`); } catch {}
    try { await this.query(`CREATE TABLE IF NOT EXISTS cidades_ativas (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL, estado VARCHAR(2) DEFAULT 'MG', ativa BOOLEAN DEFAULT true, lat DOUBLE PRECISION, lng DOUBLE PRECISION, raio_km INT DEFAULT 20, criado_em TIMESTAMP DEFAULT NOW())`); } catch {}
    try {
      const count = await this.queryOne(`SELECT COUNT(*) as total FROM cidades_ativas`);
      if (!count || Number(count.total) === 0) {
        await this.query(`INSERT INTO cidades_ativas (nome, estado, ativa, lat, lng) VALUES 
          ('Uberlândia', 'MG', true, -18.9186, -48.2772),
          ('Uberaba', 'MG', true, -19.7476, -47.9381),
          ('Araguari', 'MG', true, -18.6455, -48.1873)
          ON CONFLICT DO NOTHING`);
      }
    } catch {}
  }

  async buscarCidadesAtivas() {
    await this.garantirColunasEndereco();
    try {
      return await this.query(`SELECT id, nome, estado, lat, lng, raio_km FROM cidades_ativas WHERE ativa = true ORDER BY nome`);
    } catch {
      return [{ id: 1, nome: 'Uberlândia', estado: 'MG', lat: -18.9186, lng: -48.2772, raio_km: 20 }];
    }
  }

  async validarEnderecoNaCidadeAtiva(cidadeNome: string, lat: number, lng: number): Promise<boolean> {
    const cidades = await this.buscarCidadesAtivas();
    if (cidades.length === 0) return true;
    const cidade = cidades.find((c:any) => c.nome.toLowerCase() === cidadeNome.toLowerCase());
    if (!cidade) {
      // Se cidade informada não está na lista de ativas, bloqueia
      // Mas permite se não informou cidade (validação será pelo nome da cidade no endereço)
      return false;
    }
    // Validação simples de distância - calcula distância haversine
    if (lat && lng && cidade.lat && cidade.lng) {
      const R = 6371;
      const dLat = (lat - cidade.lat) * Math.PI / 180;
      const dLng = (lng - cidade.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(cidade.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      if (dist > (cidade.raio_km || 30)) return false;
    }
    return true;
  }


  // ================= TABELA ENDEREÇOS USUÁRIO - Só um ativo, bloqueia se trampo em andamento =================
  async garantirTabelaEnderecosUsuario() {
    await this.garantirColunasEndereco();
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS enderecos_usuario (
          id SERIAL PRIMARY KEY,
          usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          endereco_completo TEXT NOT NULL,
          bairro VARCHAR(150),
          cidade_id INT,
          cidade_nome VARCHAR(100) NOT NULL,
          estado VARCHAR(2) DEFAULT 'MG',
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          is_ativo BOOLEAN DEFAULT true,
          criado_em TIMESTAMP DEFAULT NOW(),
          atualizado_em TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch {}
    try { await this.query(`CREATE INDEX IF NOT EXISTS idx_enderecos_usuario_id ON enderecos_usuario(usuario_id)`); } catch {}
    try { await this.query(`CREATE INDEX IF NOT EXISTS idx_enderecos_ativo ON enderecos_usuario(usuario_id, is_ativo) WHERE is_ativo = true`); } catch {}
  }

  async buscarEnderecosUsuario(usuarioId: number) {
    await this.garantirTabelaEnderecosUsuario();
    try {
      return await this.query(`
        SELECT eu.*, ca.nome as cidade_nome_real, ca.estado, ca.lat as cidade_lat, ca.lng as cidade_lng
        FROM enderecos_usuario eu
        LEFT JOIN cidades_ativas ca ON ca.id = eu.cidade_id
        WHERE eu.usuario_id = $1
        ORDER BY eu.is_ativo DESC, eu.atualizado_em DESC
      `, [usuarioId]);
    } catch { return []; }
  }

  async buscarEnderecoAtivo(usuarioId: number) {
    await this.garantirTabelaEnderecosUsuario();
    try {
      return await this.queryOne(`
        SELECT * FROM enderecos_usuario WHERE usuario_id = $1 AND is_ativo = true ORDER BY atualizado_em DESC LIMIT 1
      `, [usuarioId]);
    } catch { return null; }
  }

  async verificarTrampoEmAndamento(usuarioId: number): Promise<{ em_andamento: boolean; detalhes?: any }> {
    await this.garantirTabelaEnderecosUsuario();
    // Verifica em várias tabelas possíveis: vagas, candidaturas, trampos
    const queries = [
      `SELECT id, status, titulo FROM vagas WHERE contratante_id = $1 AND status IN ('EM_ANDAMENTO','em_andamento','ATIVO','CONFIRMADO','em_aberto') LIMIT 1`,
      `SELECT id, status FROM candidaturas WHERE usuario_id = $1 AND status IN ('EM_ANDAMENTO','CONFIRMADO','ACEITO','em_andamento') LIMIT 1`,
      `SELECT id, status FROM trampos WHERE (freela_id = $1 OR contratante_id = $1) AND status IN ('EM_ANDAMENTO','ACEITO','CONFIRMADO') LIMIT 1`,
      `SELECT id, status FROM transacoes WHERE usuario_id = $1 AND status = 'EM_ANDAMENTO' LIMIT 1`,
    ];
    for (const sql of queries) {
      try {
        const rows = await this.query(sql, [usuarioId]);
        if (rows.length > 0) {
          return { em_andamento: true, detalhes: rows[0] };
        }
      } catch {}
    }
    return { em_andamento: false };
  }

  async criarEnderecoUsuario(usuarioId: number, dados: any) {
    await this.garantirTabelaEnderecosUsuario();
    // Verifica trampo em andamento - se tiver, não pode criar novo endereço ativo? Regra: pode criar mas não pode alterar ativo? Vamos bloquear alteração do ativo se tiver trampo
    const trampo = await this.verificarTrampoEmAndamento(usuarioId);
    if (trampo.em_andamento) {
      throw new Error('Não é possível alterar endereço enquanto houver trampo em andamento. Finalize os trampos ativos primeiro.');
    }

    // Validar cidade ativa
    const cidades = await this.buscarCidadesAtivas();
    const cidadeValida = cidades.some((c:any) => c.nome.toLowerCase() === (dados.cidade_nome || dados.cidade || '').toLowerCase() || c.id === dados.cidade_id);
    if (!cidadeValida) {
      throw new Error(`Cidade ${(dados.cidade_nome || dados.cidade)} não está ativa`);
    }

    // Desativa todos os outros endereços - garante só um ativo
    await this.query(`UPDATE enderecos_usuario SET is_ativo = false, atualizado_em = NOW() WHERE usuario_id = $1`, [usuarioId]);

    // Cria novo como ativo
    const rows = await this.query(`
      INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
      RETURNING *
    `, [
      usuarioId,
      dados.endereco_completo || dados.endereco,
      dados.bairro || 'Centro',
      dados.cidade_id || null,
      dados.cidade_nome || dados.cidade || 'Uberlândia',
      dados.estado || 'MG',
      dados.lat || dados.endereco_lat || null,
      dados.lng || dados.endereco_lng || null
    ]);

    // Atualiza também usuarios para compatibilidade
    try {
      await this.query(`UPDATE usuarios SET endereco_completo = $1, cidade_nome = $2, cidade_id = $3, endereco_lat = $4, endereco_lng = $5, bairro = $6 WHERE id = $7`,
        [dados.endereco_completo || dados.endereco, dados.cidade_nome || dados.cidade, dados.cidade_id, dados.lat, dados.lng, dados.bairro, usuarioId]);
    } catch {}

    return rows[0];
  }

  async atualizarEnderecoUsuario(enderecoId: number, usuarioId: number, dados: any) {
    await this.garantirTabelaEnderecosUsuario();
    const trampo = await this.verificarTrampoEmAndamento(usuarioId);
    if (trampo.em_andamento) {
      throw new Error('Não é possível alterar endereço enquanto houver trampo em andamento');
    }
    // Só permite atualizar se for o ativo ou se vai virar ativo
    const atual = await this.queryOne(`SELECT * FROM enderecos_usuario WHERE id = $1 AND usuario_id = $2`, [enderecoId, usuarioId]);
    if (!atual) throw new Error('Endereço não encontrado');

    // Se está tentando desativar o único ativo, bloqueia - deve sempre ter um ativo
    // Mas aqui estamos atualizando dados, não desativando

    const rows = await this.query(`
      UPDATE enderecos_usuario SET
        endereco_completo = COALESCE($1, endereco_completo),
        bairro = COALESCE($2, bairro),
        cidade_id = COALESCE($3, cidade_id),
        cidade_nome = COALESCE($4, cidade_nome),
        lat = COALESCE($5, lat),
        lng = COALESCE($6, lng),
        atualizado_em = NOW()
      WHERE id = $7 AND usuario_id = $8
      RETURNING *
    `, [
      dados.endereco_completo || dados.endereco,
      dados.bairro,
      dados.cidade_id,
      dados.cidade_nome || dados.cidade,
      dados.lat || dados.endereco_lat,
      dados.lng || dados.endereco_lng,
      enderecoId,
      usuarioId
    ]);
    return rows[0];
  }

  async ativarEnderecoUsuario(enderecoId: number, usuarioId: number) {
    await this.garantirTabelaEnderecosUsuario();
    const trampo = await this.verificarTrampoEmAndamento(usuarioId);
    if (trampo.em_andamento) {
      throw new Error('Não é possível alterar endereço ativo com trampo em andamento');
    }
    // Desativa todos
    await this.query(`UPDATE enderecos_usuario SET is_ativo = false, atualizado_em = NOW() WHERE usuario_id = $1`, [usuarioId]);
    // Ativa o escolhido
    const rows = await this.query(`UPDATE enderecos_usuario SET is_ativo = true, atualizado_em = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *`, [enderecoId, usuarioId]);
    if (rows.length === 0) throw new Error('Endereço não encontrado');
    // Sincroniza com usuarios
    try {
      const e = rows[0];
      await this.query(`UPDATE usuarios SET endereco_completo = $1, cidade_nome = $2, cidade_id = $3, endereco_lat = $4, endereco_lng = $5, bairro = $6 WHERE id = $7`,
        [e.endereco_completo, e.cidade_nome, e.cidade_id, e.lat, e.lng, e.bairro, usuarioId]);
    } catch {}
    return rows[0];
  }

  async deletarEnderecoUsuario(enderecoId: number, usuarioId: number) {
    await this.garantirTabelaEnderecosUsuario();
    const trampo = await this.verificarTrampoEmAndamento(usuarioId);
    if (trampo.em_andamento) {
      throw new Error('Não é possível deletar endereço com trampo em andamento');
    }
    const atual = await this.queryOne(`SELECT * FROM enderecos_usuario WHERE id = $1 AND usuario_id = $2`, [enderecoId, usuarioId]);
    if (!atual) throw new Error('Endereço não encontrado');
    if (atual.is_ativo) {
      // Se é o ativo e tem outros, ativa o mais recente
      const outros = await this.query(`SELECT id FROM enderecos_usuario WHERE usuario_id = $1 AND id != $2 ORDER BY atualizado_em DESC LIMIT 1`, [usuarioId, enderecoId]);
      if (outros.length > 0) {
        await this.query(`UPDATE enderecos_usuario SET is_ativo = true WHERE id = $1`, [outros[0].id]);
      } else {
        throw new Error('Não é possível deletar o único endereço ativo. Crie outro antes.');
      }
    }
    await this.query(`DELETE FROM enderecos_usuario WHERE id = $1 AND usuario_id = $2`, [enderecoId, usuarioId]);
    return { sucesso: true };
  }

  async migrarEnderecosAntigosParaNovaTabela() {
    await this.garantirTabelaEnderecosUsuario();
    try {
      const usuarios = await this.query(`SELECT id, endereco_completo, bairro, cidade_id, cidade_nome, endereco_lat, endereco_lng FROM usuarios WHERE endereco_completo IS NOT NULL`);
      for (const u of usuarios) {
        const existe = await this.queryOne(`SELECT id FROM enderecos_usuario WHERE usuario_id = $1 AND is_ativo = true`, [u.id]);
        if (!existe) {
          await this.query(`INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT DO NOTHING`,
            [u.id, u.endereco_completo, u.bairro, u.cidade_id, u.cidade_nome, u.endereco_lat, u.endereco_lng]);
        }
      }
    } catch {}
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