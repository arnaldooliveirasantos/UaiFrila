import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { BaseRepository } from '../repositories/BaseRepository';
import { BaseController } from './BaseController';

// ValidarCodigo REAL - App.ts aponta /api/auth/validar-codigo para cá.
//   - valida o código no banco (email_historico_disparos, não expirado, não consumido)
//   - tipo=cadastro: INSERT usuario + INSERT endereco na mesma transação (BEGIN/COMMIT), gera JWT
//   - tipo=login: busca usuário, bloqueia CANCELADO, gera JWT
//   - consome o código (status -> CONSUMIDO) para não reutilizar

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';

function gerarToken(usuario: any, tipoChave: string, nivel: number, tipoUsuarioId: number) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipoUsuarioId, tipoChave, tipo_chave: tipoChave, nivelPermissao: nivel, nivel_permissao: nivel, isAdmin: nivel >= 80 || ['ADMIN', 'SUPER_ADMIN'].includes(String(tipoChave).toUpperCase()) },
    JWT_SECRET, { expiresIn: '7d' }
  );
}
function publico(u: any) {
  if (!u) return null;
  const { senha_hash, senha, senhaHash, ...resto } = u as any;
  return resto;
}

export class ValidarCodigoController extends BaseController {
  validarCodigo = async (req: Request, res: Response) => {
    try {
      const { email, codigo, tipo } = req.body || {};
      console.log(`[validarCodigo REAL] email=${email} tipo=${tipo} codigo=${codigo}`);
      if (!email || !codigo) return this.error(res, 'E-mail e código obrigatórios', 400);
      const pool = BaseRepository.getPool();
      if (!pool) return this.error(res, 'Banco não conectado (pool)', 500);
      const emailNorm = String(email).trim().toLowerCase();
      const codigoNorm = String(codigo).trim();
      const tipoFinal = tipo === 'cadastro' ? 'cadastro' : 'login';

      // 1. Valida código no banco - busca TOLERANTE primeiro, depois decide o motivo.
      // Antes: WHERE expira_em > NOW() AND status IN (EM_ESPERA,ENVIADO) - se QUALQUER um desses 2 estivesse
      // errado (status sem chave, expira_em NULL, codigo gravado como int), caía em "Código inválido" sem dizer o porquê.
      // Agora: busca por email+codigo, ignora status/expiração, e o erro diz o motivo real.
      const rCodigo = await pool.query(
        `SELECT h.*, es.chave as status_chave FROM email_historico_disparos h LEFT JOIN email_status es ON es.id = h.status_id
         WHERE LOWER(TRIM(h.email_destinatario)) = LOWER($1) AND TRIM(CAST(h.codigo_verificacao AS TEXT)) = $2
         ORDER BY h.criado_em DESC LIMIT 1`,
        [emailNorm, codigoNorm]
      );
      const codigoRow = rCodigo.rows[0] || null;
      if (!codigoRow) {
        // Diagnóstico: mostra o que REALMENTE está no banco para esse e-mail (últimos 3)
        const rDiag = await pool.query(`SELECT h.codigo_verificacao, h.expira_em, es.chave as status_chave, h.criado_em FROM email_historico_disparos h LEFT JOIN email_status es ON es.id=h.status_id WHERE LOWER(TRIM(h.email_destinatario))=LOWER($1) ORDER BY h.criado_em DESC LIMIT 3`, [emailNorm]);
        console.log('[validarCodigo REAL] NENHUM codigo igual no banco', { email: emailNorm, codigoRecebido: codigoNorm, ultimosNoBanco: rDiag.rows });
        return this.error(res, 'Código inválido - não encontrado para este e-mail. Clique em Reenviar e use o código NOVO (o da última mensagem).', 400);
      }
      const statusCodigo = String(codigoRow.status_chave || '').toUpperCase();
      console.log('[validarCodigo REAL] codigo achado', { email: emailNorm, codigo: codigoNorm, status: statusCodigo, expira_em: codigoRow.expira_em, criado_em: codigoRow.criado_em });
      if (statusCodigo === 'CONSUMIDO') return this.error(res, 'Este código já foi usado. Clique em Reenviar e use o código NOVO.', 400);
      if (statusCodigo === 'CANCELADO') return this.error(res, 'Este código foi cancelado porque você pediu outro depois. Use o código NOVO (o da última mensagem).', 400);
      if (codigoRow.expira_em && new Date(codigoRow.expira_em) < new Date()) return this.error(res, 'Código expirado. Clique em Reenviar e use o código NOVO.', 400);
      if (!['EM_ESPERA', 'ENVIADO', '', 'NULL'].includes(statusCodigo) && statusCodigo !== 'PENDENTE') {
        // Status desconhecido (ex: tabela email_status com outra chave) - NÃO bloqueia, segue com o código
        console.warn('[validarCodigo REAL] status desconhecido, seguindo mesmo assim:', statusCodigo);
      }

      // 2. Usuário existente?
      const rUser = await pool.query(`SELECT u.*, su.chave as status_chave FROM usuarios u LEFT JOIN status_usuario su ON su.id=u.status_usuario_id WHERE LOWER(u.email)=LOWER($1) LIMIT 1`, [emailNorm]);
      const usuarioExistente = rUser.rows[0] || null;
      const statusExistente = String(usuarioExistente?.status_chave || '').toUpperCase();

      // ===== LOGIN =====
      if (tipoFinal === 'login') {
        if (!usuarioExistente) return this.error(res, 'Usuário não encontrado - faça o cadastro primeiro', 404);
        if (statusExistente === 'CANCELADO') return this.error(res, 'Cadastro cancelado. Você pode cadastrar novamente com o mesmo e-mail e CPF.', 403);
        // AGUARDANDO_VALIDACAO NÃO bloqueia login - só CANCELADO bloqueia.
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE UPPER(chave)='CONSUMIDO'), atualizado_em=NOW() WHERE id=$1`, [codigoRow.id]);
          await client.query('COMMIT');
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
        const rTipo = await pool.query(`SELECT chave, nivel_permissao FROM tipos_usuario WHERE id=$1 LIMIT 1`, [usuarioExistente.tipo_usuario_id]);
        if (!rTipo.rows[0]?.chave) return this.error(res, `Tipo de usuário id=${usuarioExistente.tipo_usuario_id} não cadastrado em tipos_usuario`, 500);
        const tipoChave = rTipo.rows[0].chave;
        const nivel = Number(rTipo.rows[0].nivel_permissao ?? 0);
        const token = gerarToken(usuarioExistente, tipoChave, nivel, usuarioExistente.tipo_usuario_id);
        const usuario = publico({ ...usuarioExistente, tipo_chave: tipoChave, tipoChave, nivel_permissao: nivel });
        console.log(`[validarCodigo REAL] LOGIN OK usuario=${usuarioExistente.id}`);
        return res.json({ success: true, token, usuario, data: { token, usuario } });
      }

      // ===== CADASTRO =====
      // REGRA NOVA: o usuário JÁ foi criado no Cadastrar (solicitar) com AGUARDANDO_VALIDACAO.
      // Aqui o validar SÓ altera para ATIVO. NÃO cria usuário.
      // Se não existir usuário, erro - NÃO cria (sem fallback).
      if (usuarioExistente && statusExistente === 'CANCELADO') return this.error(res, 'Cadastro cancelado. Você pode cadastrar novamente com o mesmo e-mail e CPF.', 403);
      const dados = (req.body.dadosCadastro && typeof req.body.dadosCadastro === 'object' ? req.body.dadosCadastro : req.body) || {};
      // Busca id de ATIVO
      let statusAtivoId: number | null = null;
      // Status já existe no banco (confirmado) - só SELECT, sem INSERT.
      try { const rs = await pool.query(`SELECT id FROM status_usuario WHERE UPPER(TRIM(chave))='ATIVO' LIMIT 1`); statusAtivoId = rs.rows[0] ? Number(rs.rows[0].id) : null; } catch {}
      if (!statusAtivoId) return this.error(res, 'Status ATIVO não cadastrado - rode o SQL de status no banco', 500);

      if (usuarioExistente) {
        // Já existe: se está AGUARDANDO, ativa. Se já está ATIVO, só consome o código (idempotente).
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE UPPER(chave)='CONSUMIDO'), atualizado_em=NOW() WHERE id=$1`, [codigoRow.id]);
          if (statusExistente === 'AGUARDANDO_VALIDACAO') {
            await client.query(`UPDATE usuarios SET status_usuario_id=$1 WHERE id=$2`, [statusAtivoId, usuarioExistente.id]);
            console.log(`[validarCodigo REAL] CADASTRO ativou usuario=${usuarioExistente.id} AGUARDANDO_VALIDACAO -> ATIVO (${statusAtivoId})`);
          } else {
            console.log(`[validarCodigo REAL] CADASTRO usuario=${usuarioExistente.id} já estava ${statusExistente} - só consumiu o código`);
          }
          await client.query('COMMIT');
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
        const rTipo = await pool.query(`SELECT chave, nivel_permissao FROM tipos_usuario WHERE id=$1 LIMIT 1`, [usuarioExistente.tipo_usuario_id]);
        if (!rTipo.rows[0]?.chave) return this.error(res, `Tipo de usuário id=${usuarioExistente.tipo_usuario_id} não cadastrado em tipos_usuario`, 500);
        const tipoChave = rTipo.rows[0].chave;
        const nivel = Number(rTipo.rows[0].nivel_permissao ?? 0);
        const rNovo = await pool.query(`SELECT * FROM usuarios WHERE id=$1 LIMIT 1`, [usuarioExistente.id]);
        const token = gerarToken(rNovo.rows[0], tipoChave, nivel, usuarioExistente.tipo_usuario_id);
        const usuario = publico({ ...rNovo.rows[0], tipo_chave: tipoChave, tipoChave, nivel_permissao: nivel });
        return res.json({ success: true, token, usuario, data: { token, usuario } });
      }
      // SEM FALLBACK: se o usuário não existe, o Cadastrar não foi feito.
      // NÃO cria usuário aqui. O usuário só nasce no Cadastrar (solicitar) com AGUARDANDO_VALIDACAO.
      // Se caiu aqui, o frontend chamou validar sem passar pelo Cadastrar.
      return this.error(res, 'Usuário não encontrado. Volte e clique em Cadastrar de novo (o cadastro cria o usuário com AGUARDANDO_VALIDACAO).', 400);
    } catch (e: any) { console.error('[validarCodigo REAL]', e); return this.handleError(res, e); }
  };
}
