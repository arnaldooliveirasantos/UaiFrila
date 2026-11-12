import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';
import { BaseController } from './BaseController';

// REGRA NOVA (definitiva):
//   Clicou em Cadastrar (CadastroUnificado -> POST /api/auth/solicitar-codigo tipo=cadastro)
//     => CRIA o usuário com status AGUARDANDO_VALIDACAO (+ endereço), e envia o código.
//   Chegou o e-mail com código, digitou e validou (POST /api/auth/validar-codigo tipo=cadastro)
//     => SÓ ALTERA o status para ATIVO. NÃO cria usuário.
//   Cancelar (POST /api/auth/cancelar-cadastro)
//     => status CANCELADO + anonimiza e-mail/CPF + apaga endereço (regras anteriores).
// Antes: solicitar só gravava o código, validar criava o usuário. Por isso o usuário
// "sumia" se o validar falhasse, e o status nascia errado.

async function getStatusId(pool: any, chave: string): Promise<number | null> {
  // Status já existe no banco (AGUARDANDO_VALIDACAO confirmado) - só SELECT, sem INSERT.
  const r = await pool.query(`SELECT id FROM status_usuario WHERE UPPER(TRIM(chave)) = $1 LIMIT 1`, [chave.toUpperCase()]);
  return r.rows[0] ? Number(r.rows[0].id) : null;
}
async function getCols(pool: any, table: string): Promise<Set<string>> {
  const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
  return new Set(r.rows.map((x: any) => x.column_name));
}
function buildInsert(cols: Set<string>, campos: Record<string, any>): { sql: string; vals: any[] } | null {
  const usar = Object.entries(campos).filter(([c]) => cols.has(c));
  if (cols.has('criado_em')) usar.push(['criado_em', '__NOW__']);
  if (!usar.length) return null;
  // Contador próprio: '__NOW__' vira NOW() e NÃO consome parâmetro (mesmo bug do cancelar, 42P18)
  let pi = 1; const vals: any[] = [];
  const ph = usar.map(([, v]) => { if (v === '__NOW__') return 'NOW()'; vals.push(v); return `$${pi++}`; }).join(', ');
  return { sql: `(${usar.map(([c]) => c).join(', ')}) VALUES (${ph})`, vals };
}

export class SolicitarCodigoController extends BaseController {
  solicitarCodigo = async (req: Request, res: Response) => {
    try {
      const { email, tipo, dadosCadastro } = req.body || {};
      if (!email?.includes('@')) return this.error(res, 'E-mail inválido', 400);
      const emailNorm = String(email).trim().toLowerCase();
      const tipoFinal = tipo === 'cadastro' ? 'cadastro' : 'login';
      const pool = BaseRepository.getPool();
      if (!pool) return this.error(res, 'Banco não conectado (pool)', 500);
      const rUser = await pool.query(`SELECT u.*, su.chave as status_chave FROM usuarios u LEFT JOIN status_usuario su ON su.id=u.status_usuario_id WHERE LOWER(u.email)=LOWER($1) LIMIT 1`, [emailNorm]);
      const existente = rUser.rows[0] || null;
      const statusExistente = String(existente?.status_chave || '').toUpperCase();
      // LOGIN: só quem já existe e não está cancelado
      if (tipoFinal === 'login') {
        if (!existente) return this.error(res, 'Usuário não encontrado - faça o cadastro primeiro', 404);
        if (statusExistente === 'CANCELADO') return this.error(res, 'Cadastro cancelado. Você pode cadastrar novamente.', 403);
      }
      // CADASTRO: ATIVO bloqueia (já cadastrado). CANCELADO libera (e-mail já foi anonimizado, então nem acha aqui).
      // AGUARDANDO_VALIDACAO NÃO bloqueia: é o mesmo cadastro pedindo reenviar -> atualiza os dados e manda novo código.
      if (tipoFinal === 'cadastro' && existente && statusExistente === 'ATIVO') return this.error(res, 'E-mail já cadastrado - faça login', 409);
      if (tipoFinal === 'cadastro' && existente && !['AGUARDANDO_VALIDACAO', 'CANCELADO'].includes(statusExistente)) return this.error(res, 'E-mail já cadastrado - faça login', 409);

      let usuarioId: number | null = existente?.id || null;
      // ===== CADASTRO: cria (ou atualiza) o usuário AGUARDANDO_VALIDACAO AGORA, no Cadastrar =====
      if (tipoFinal === 'cadastro' && dadosCadastro && typeof dadosCadastro === 'object') {
        const dados = dadosCadastro;
        const end = (dados.endereco && typeof dados.endereco === 'object' ? dados.endereco : dados) || {};
        const nome = dados.nome || dados.nome_completo || '';
        const cpf = String(dados.cpf || '').replace(/\D/g, '');
        if (!nome || !cpf) return this.error(res, 'Dados do cadastro incompletos (nome/CPF). Preencha o cadastro de novo.', 400);
        if (!end.cidade_id) return this.error(res, 'Cidade obrigatória no cadastro. Selecione a cidade de novo.', 400);
        const statusAguardandoId = await getStatusId(pool, 'AGUARDANDO_VALIDACAO');
        if (!statusAguardandoId) return this.error(res, 'Status AGUARDANDO_VALIDACAO não cadastrado - rode o SQL de status no banco', 500);
        if (!dados.tipo_chave && !dados.tipoChave) return this.error(res, 'tipo_chave obrigatório no cadastro (FREELA / CONTRATANTE / DUAL).', 400);
        const tipoChave = String(dados.tipo_chave || dados.tipoChave).toUpperCase();
        const rTipo = await pool.query(`SELECT id FROM tipos_usuario WHERE UPPER(chave)=$1 LIMIT 1`, [tipoChave]);
        if (!rTipo.rows[0]?.id) return this.error(res, `Tipo de usuário '${tipoChave}' não cadastrado em tipos_usuario - cadastre no banco`, 500);
        const tipoUsuarioId = Number(rTipo.rows[0].id);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const cols = await getCols(client, 'usuarios');
          if (!existente) {
            // senha_hash NÃO é usado mais (login é por código) e a coluna agora é NULLABLE (alterada pelo usuário).
            // NÃO manda o campo - o banco grava NULL e não falha com 23502.
            const campos: Record<string, any> = { nome_completo: nome, email: emailNorm, cpf: cpf || null, cnpj: dados.cnpj || null, nome_fantasia: dados.nomeFantasia || dados.nome_fantasia || null, funcao_principal: dados.funcao || dados.funcao_principal || 'Garçom', valor_hora_base: Number(dados.valorHora ?? dados.valor_hora_base ?? 20), bio: dados.bio || null, tipo_usuario_id: tipoUsuarioId, status_usuario_id: statusAguardandoId, tem_mei: !!(dados.temMei ?? dados.tem_mei) };
            if (!cols.has('nome_completo') && cols.has('nome')) campos['nome'] = nome;
            const ins = buildInsert(cols, campos);
            if (!ins) throw new Error('Tabela usuarios sem colunas conhecidas');
            const r = await client.query(`INSERT INTO usuarios ${ins.sql} RETURNING id`, ins.vals);
            usuarioId = r.rows[0].id;
            console.log(`[solicitarCodigo] CADASTRO criou usuario=${usuarioId} status=AGUARDANDO_VALIDACAO (${statusAguardandoId})`);
          } else {
            // Reenviar: atualiza os dados do cadastro pendente, NÃO duplica, NÃO muda o status (continua AGUARDANDO)
            const sets: string[] = []; const vals: any[] = []; let i = 1;
            const upd: Record<string, any> = { nome_completo: nome, cpf: cpf || null, cnpj: dados.cnpj || null, nome_fantasia: dados.nomeFantasia || dados.nome_fantasia || null, funcao_principal: dados.funcao || dados.funcao_principal || 'Garçom', valor_hora_base: Number(dados.valorHora ?? dados.valor_hora_base ?? 20), bio: dados.bio || null, tipo_usuario_id: tipoUsuarioId, tem_mei: !!(dados.temMei ?? dados.tem_mei) }; // sem senha_hash - NULLABLE, não usa
            for (const [col, v] of Object.entries(upd)) { if (cols.has(col)) { sets.push(`${col}=$${i++}`); vals.push(v); } }
            if (sets.length) { vals.push(usuarioId); await client.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id=$${i}`, vals); }
            console.log(`[solicitarCodigo] CADASTRO atualizou usuario=${usuarioId} (reenviar, continua AGUARDANDO_VALIDACAO)`);
          }
          // Endereço: cria se não existir, atualiza se já existir (1 endereço ativo por usuário no cadastro)
          try {
            const colsEnd = await getCols(client, 'enderecos');
            const rEnd = await client.query(`SELECT id FROM enderecos WHERE usuario_id=$1 LIMIT 1`, [usuarioId]);
            const camposEnd: Record<string, any> = { usuario_id: usuarioId, cep: end.cep || null, logradouro: end.logradouro || end.endereco || '', numero: end.numero || null, complemento: end.complemento || null, bairro: end.bairro || null, cidade_id: Number(end.cidade_id), tipo_endereco_id: 1, latitude: end.latitude ?? end.lat ?? null, longitude: end.longitude ?? end.lng ?? null, apelido: end.apelido || 'Casa', ativo: true };
            if (colsEnd.has('endereco') && !colsEnd.has('logradouro')) camposEnd['endereco'] = camposEnd.logradouro;
            if (!rEnd.rows[0]) {
              const ins = buildInsert(colsEnd, camposEnd);
              if (ins) await client.query(`INSERT INTO enderecos ${ins.sql}`, ins.vals);
            } else {
              const sets: string[] = []; const vals: any[] = []; let j = 1;
              for (const [col, v] of Object.entries(camposEnd)) { if (col !== 'usuario_id' && colsEnd.has(col)) { sets.push(`${col}=$${j++}`); vals.push(v); } }
              if (sets.length) { vals.push(rEnd.rows[0].id); await client.query(`UPDATE enderecos SET ${sets.join(', ')} WHERE id=$${j}`, vals); }
            }
          } catch (eEnd: any) { throw new Error('Endereço não criado: ' + eEnd.message); } // SEM fallback: endereço nasce junto com o usuário, se falhar o cadastro inteiro faz ROLLBACK
          await client.query('COMMIT');
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
      } else if (tipoFinal === 'cadastro' && !dadosCadastro) {
        // SEM fallback/mock: cadastro sem dados não cria usuário e não manda código.
        return this.error(res, 'Dados do cadastro não enviados. Volte e clique em Cadastrar de novo.', 400);
      }
      // ===== Código =====
      // email_historico_disparos: NÃO assume colunas. A sua tabela NÃO tem coluna "tipo" (erro 42703).
      // Monta o INSERT só com as colunas que existem de verdade.
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      const rColsHist = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='email_historico_disparos'`);
      const colsHist = new Set(rColsHist.rows.map((r: any) => r.column_name));
      console.log('[solicitarCodigo] colunas email_historico_disparos no banco:', [...colsHist].join(','));
      // Invalida códigos antigos pendentes - só se a coluna de status existir
      try {
        if (colsHist.has('status_id')) {
          await pool.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE UPPER(chave)='CANCELADO') WHERE LOWER(email_destinatario)=LOWER($1) AND status_id IN (SELECT id FROM email_status WHERE UPPER(chave) IN ('EM_ESPERA','ENVIADO'))`, [emailNorm]);
        } else if (colsHist.has('status')) {
          await pool.query(`UPDATE email_historico_disparos SET status='CANCELADO' WHERE LOWER(email_destinatario)=LOWER($1) AND UPPER(status) IN ('EM_ESPERA','ENVIADO')`, [emailNorm]);
        }
      } catch (eInv: any) { console.warn('[solicitarCodigo] não conseguiu invalidar códigos antigos:', eInv.message); }
      // Monta INSERT dinâmico
      const colEmailHist = ['email_destinatario', 'email', 'destinatario', 'email_destino'].find(c => colsHist.has(c));
      const colCodigoHist = ['codigo_verificacao', 'codigo', 'codigo_validacao'].find(c => colsHist.has(c));
      const colTipoHist = ['tipo', 'tipo_disparo', 'chave_uso', 'finalidade', 'tipo_envio'].find(c => colsHist.has(c));
      if (!colEmailHist || !colCodigoHist) throw new Error('Tabela email_historico_disparos sem coluna de e-mail/código - confira o schema. Colunas: ' + [...colsHist].join(','));
      // ===== Template: busca em email_templates pela chave_uso e resolve os placeholders =====
      // Antes: o INSERT não mandava template_id / titulo_final / conteudo_final / email_remetente,
      // então o histórico ficava sem a informação do template (título e corpo vazios).
      // Agora: busca o template real e grava tudo resolvido.
      const chaveUso = tipoFinal === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN';
      let template: any = null;
      try {
        const rTplCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='email_templates'`);
        const colsTpl = new Set(rTplCols.rows.map((r: any) => r.column_name));
        if (colsTpl.size) {
          const colChaveTpl = ['chave_uso', 'chave', 'uso'].find(c => colsTpl.has(c));
          if (colChaveTpl) {
            const rTpl = await pool.query(`SELECT * FROM email_templates WHERE UPPER(TRIM(${colChaveTpl})) = $1 LIMIT 1`, [chaveUso]);
            template = rTpl.rows[0] || null;
            if (template) console.log(`[solicitarCodigo] template achado id=${template.id} chave_uso=${chaveUso} titulo=${template.titulo_assunto || template.titulo || ''}`);
            else console.warn(`[solicitarCodigo] template NÃO achado para chave_uso=${chaveUso} - histórico vai sem template_id`);
          }
        }
      } catch (eTpl: any) { console.warn('[solicitarCodigo] não conseguiu ler email_templates:', eTpl.message); }
      // Resolve placeholders do template: {{NOME}}, {{CODIGO}}, {{TEMPO_EXPIRACAO}}, {{LINK_VALIDAR}}, {{LINK_CANCELAR}}, {{FRONTEND_URL}}
      const nomeParaTemplate = (dadosCadastro as any)?.nome || (dadosCadastro as any)?.nome_completo || existente?.nome_completo || existente?.nome || '';
      const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.24.11:5173';
      const linkValidar = `${frontendUrl}/validar?codigo=${codigo}&email=${encodeURIComponent(emailNorm)}&tipo=${tipoFinal}`;
      // Link de cancelar: /cancelar?cancelar=true&codigo=...&email=...
      // Com cancelar=true, até o App antigo reconhece. Com /cancelar, o App novo reconhece. Os dois juntos = à prova de versão.
      const linkCancelar = `${frontendUrl}/cancelar?cancelar=true&codigo=${codigo}&email=${encodeURIComponent(emailNorm)}`;
      const resolver = (texto: string) => String(texto || '')
        .replace(/\{\{\s*NOME\s*\}\}/g, nomeParaTemplate)
        .replace(/\{\{\s*CODIGO\s*\}\}/g, codigo)
        .replace(/\{\{\s*TEMPO_EXPIRACAO\s*\}\}/g, '5 minutos')
        .replace(/\{\{\s*LINK_VALIDAR\s*\}\}/g, linkValidar)
        .replace(/\{\{\s*LINK_CANCELAR\s*\}\}/g, linkCancelar)
        .replace(/\{\{\s*FRONTEND_URL\s*\}\}/g, frontendUrl);
      const camposHist: Record<string, any> = { [colEmailHist]: emailNorm, [colCodigoHist]: codigo };
      // tipo: se a coluna for chave_uso, usa a chave do template; se for tipo, usa 'cadastro'/'login'
      if (colTipoHist) camposHist[colTipoHist] = colTipoHist === 'chave_uso' ? (tipoFinal === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN') : tipoFinal;
      if (colsHist.has('status_id')) camposHist['status_id'] = '__EM_ESPERA_ID__';
      else if (colsHist.has('status')) camposHist['status'] = 'EM_ESPERA';
      if (colsHist.has('expira_em')) camposHist['expira_em'] = '__EXPIRA__';
      else if (colsHist.has('data_expiracao')) camposHist['data_expiracao'] = '__EXPIRA__';
      else if (colsHist.has('validade')) camposHist['validade'] = '__EXPIRA__';
      // Template no histórico: só manda se a coluna existir e o template existir
      if (colsHist.has('template_id') && template?.id) camposHist['template_id'] = Number(template.id);
      if (colsHist.has('titulo_final') && template) camposHist['titulo_final'] = resolver(template.titulo_assunto || template.titulo || '');
      if (colsHist.has('conteudo_final') && template) camposHist['conteudo_final'] = resolver(template.conteudo_corpo || template.conteudo || template.corpo || '');
      if (colsHist.has('email_remetente') && template?.email_remetente) camposHist['email_remetente'] = template.email_remetente;
      else if (colsHist.has('email_remetente') && template) camposHist['email_remetente'] = process.env.EMAIL_REMETENTE || 'contato@uaifrila.com.br';
      if (colsHist.has('nome_remetente') && template?.nome_remetente) camposHist['nome_remetente'] = template.nome_remetente;
      // Sua tabela TEM usuario_id e dados_cadastro - grava os dois para o histórico ficar rastreável
      if (colsHist.has('usuario_id') && usuarioId) camposHist['usuario_id'] = usuarioId;
      if (colsHist.has('dados_cadastro') && tipoFinal === 'cadastro' && dadosCadastro) camposHist['dados_cadastro'] = JSON.stringify(dadosCadastro);
      if (colsHist.has('criado_em')) camposHist['criado_em'] = '__NOW__';
      else if (colsHist.has('data_criacao')) camposHist['data_criacao'] = '__NOW__';
      const nomesHist = Object.keys(camposHist).join(', ');
      // BUG que fazia usuario_id sumir: o placeholder usava o índice da entrada (i+1),
      // contando também os valores especiais (NOW(), subquery, expira) que NÃO são parâmetros.
      // Ex: email=$1, codigo=$2, status_id=(subquery), expira=NOW()+..., usuario_id=$5
      // mas valsHist só tinha [email, codigo, usuario_id] (3 valores) -> o $5 não existia
      // e o usuario_id ia para o lugar errado / não era gravado.
      // CORREÇÃO: contador próprio, só incrementa para valores reais.
      const valsHist: any[] = [];
      let paramIdx = 1;
      const phHist = Object.entries(camposHist).map(([c, v]) => {
        if (v === '__NOW__') return 'NOW()';
        if (v === '__EXPIRA__') return "NOW() + INTERVAL '5 minutes'";
        if (v === '__EM_ESPERA_ID__') return "(SELECT id FROM email_status WHERE UPPER(chave)='EM_ESPERA')";
        valsHist.push(v);
        return `$${paramIdx++}`;
      }).join(', ');
      console.log(`[solicitarCodigo] INSERT historico usuario_id=${usuarioId ?? 'NULL'} valores=${JSON.stringify(valsHist.map(v => typeof v === 'string' && v.length > 40 ? v.slice(0, 40) + '...' : v))}`);
      await pool.query(`INSERT INTO email_historico_disparos (${nomesHist}) VALUES (${phHist})`, valsHist);
      console.log(`[solicitarCodigo] código gravado em email_historico_disparos email=${emailNorm} tipo=${tipoFinal} usuario_id=${usuarioId ?? 'NULL'} colunas usadas: ${nomesHist}`);
      // EmailService é ESTÁTICO e recebe OBJETO - NÃO é instância e NÃO recebe (email, codigo, tipo).
      // ANTES: const svc = new EmailService(); svc.enviarCodigo(emailNorm, codigo, tipoFinal)
      // -> "EmailService.enviarCodigo não existe" (o método é static, não está na instância)
      // -> retornava 500 mesmo com usuário + código JÁ gravados no banco.
      // AGORA: EmailService.enviarCodigo({ email, nome, codigo, tipo, tempoExpiracaoMin })
      // ATENÇÃO: o EmailService atual SÓ LOGA o template no terminal (TODO SMTP).
      // Ele NÃO envia e-mail de verdade. O código fica no histórico + log do backend.
      // Para enviar de verdade, falta ligar o SMTP no EmailService (transporter.sendMail).
      try {
        const { EmailService } = require('../services/EmailService');
        const metodo = EmailService.enviarCodigo || EmailService.prototype?.enviarCodigo;
        if (typeof metodo !== 'function') throw new Error('EmailService.enviarCodigo não existe (nem static nem instância)');
        // tipoFinal aqui é só 'cadastro' | 'login' (linha 40: tipo === 'cadastro' ? 'cadastro' : 'login').
        // NÃO tem 'reenvio' - o reenvio usa a mesma função com tipo=login e o template 2FA_LOGIN.
        // ANTES: (tipoFinal === 'reenvio' ? 'reenvio' : tipoFinal) -> TS2367: tipos sem overlap, build quebrava.
        await EmailService.enviarCodigo({ email: emailNorm, nome: nomeParaTemplate || 'Uai Frila', codigo, tipo: tipoFinal, tempoExpiracaoMin: 5 });
        console.log(`[solicitarCodigo] EmailService.enviarCodigo OK email=${emailNorm} tipo=${tipoFinal} (só loga - SMTP ainda não ligado)`);
      } catch (eEmail: any) { return this.error(res, 'E-mail não enviado: ' + (eEmail.message || 'EmailService falhou'), 500); }
      return res.json({ success: true, message: 'Código enviado para seu e-mail', usuario_id: usuarioId, usuario_existente: !!existente });
    } catch (e: any) { return this.handleError(res, e); }
  };
  reenviarCodigo = this.solicitarCodigo;
}
