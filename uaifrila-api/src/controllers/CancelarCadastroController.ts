import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';
import { BaseController } from './BaseController';

// Controller SOZINHO para cancelar cadastro - NÃO precisa editar AuthController.
// Por que a v1 falhou: colar método dentro de AuthController + travas manuais é fácil de errar
// (chave errada, método fora da classe, esquecer de salvar, backend não reiniciado).
// Aqui: 1 arquivo novo + 2 linhas no App.ts = funciona.

export class CancelarCadastroController extends BaseController {
  cancelarCadastro = async (req: Request, res: Response) => {
    try {
      const { email, codigo } = req.body || {};
      if (!email || !codigo) return this.error(res, 'E-mail e código obrigatórios', 400);
      const pool = BaseRepository.getPool();
      if (!pool) return this.error(res, 'Banco não conectado (pool)', 500);
      const emailNorm = String(email).trim().toLowerCase();
      const codigoNorm = String(codigo).trim();

      // 1. Valida código - aceita EM_ESPERA / ENVIADO, não expirado, não consumido
      const rCodigo = await pool.query(
        `SELECT h.id, h.email_destinatario FROM email_historico_disparos h
         WHERE LOWER(TRIM(h.email_destinatario))=LOWER($1) AND TRIM(CAST(h.codigo_verificacao AS TEXT))=$2 AND h.expira_em > NOW()
         AND h.status_id IN (SELECT id FROM email_status WHERE UPPER(chave) IN ('EM_ESPERA','ENVIADO'))
         ORDER BY h.criado_em DESC LIMIT 1`,
        [emailNorm, codigoNorm]
      );
      if (rCodigo.rows.length === 0) {
        // Diagnóstico: ajuda a saber se é código errado, expirado ou já usado
        const rQualquer = await pool.query(
          `SELECT h.codigo_verificacao, h.expira_em, h.status_id, es.chave as status_chave FROM email_historico_disparos h LEFT JOIN email_status es ON es.id=h.status_id WHERE LOWER(h.email_destinatario)=LOWER($1) ORDER BY h.criado_em DESC LIMIT 1`,
          [emailNorm]
        );
        const ultimo = rQualquer.rows[0];
        console.log('[cancelarCadastro] codigo invalido', { email: emailNorm, codigoRecebido: codigoNorm, ultimoNoBanco: ultimo });
        if (ultimo && String(ultimo.codigo_verificacao) === codigoNorm) {
          if (String(ultimo.status_chave || '').toUpperCase() === 'CONSUMIDO') return this.error(res, 'Este link já foi usado (código consumido). Solicite um novo código.', 400);
          if (new Date(ultimo.expira_em) < new Date()) return this.error(res, 'Link expirado. Solicite um novo código.', 400);
        }
        return this.error(res, 'Link de cancelamento inválido - código não confere com o e-mail', 400);
      }
      const codigoRow = rCodigo.rows[0];
      const rUser = await pool.query(`SELECT * FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [emailNorm]);
      const usuario = rUser.rows[0] || null;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE UPPER(chave)='CONSUMIDO'), atualizado_em=NOW() WHERE id=$1`, [codigoRow.id]);

        if (!usuario) {
          await client.query('COMMIT');
          return res.json({ success: true, message: 'Cadastro cancelado. Nenhum usuário tinha sido criado com este e-mail. Você pode cadastrar novamente.', usuario_existente: false });
        }
        const usuarioId = usuario.id;
        const rStatusAtual = await client.query(`SELECT chave FROM status_usuario WHERE id=$1 LIMIT 1`, [usuario.status_usuario_id]);
        if ((rStatusAtual.rows[0]?.chave || '').toUpperCase() === 'CANCELADO') {
          await client.query('COMMIT');
          return res.json({ success: true, message: 'Cadastro já estava cancelado. Você pode cadastrar novamente com o mesmo e-mail e CPF.', usuario_existente: true, usuario_id: usuarioId });
        }
        const rCancelado = await client.query(`SELECT id FROM status_usuario WHERE UPPER(chave)='CANCELADO' LIMIT 1`);
        if (!rCancelado.rows[0]) { await client.query('ROLLBACK'); return this.error(res, 'Status CANCELADO não cadastrado - rode 01_status_usuario_CANCELADO.sql no banco', 500); }
        const statusCanceladoId = rCancelado.rows[0].id;
        const emailAnonimizado = `${usuarioId}@cancelado.com`;
        const cpfAnonimizado = String(usuarioId);

        // UPDATE DINÂMICO: só usa colunas que existem (mesma regra do validar - evita 25P02).
        // Regra: status CANCELADO + e-mail/CPF anonimizados + dados LGPD apagados (nome, telefone, bio, etc).
        // Funciona para AGUARDANDO_VALIDACAO e para ATIVO - o cancelar não distingue os dois.
        const rColsU = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios'`);
        const colsU = new Set(rColsU.rows.map((r: any) => r.column_name));
        const upd: Record<string, any> = { email: emailAnonimizado, cpf: cpfAnonimizado, nome_completo: 'Usuário Cancelado', status_usuario_id: statusCanceladoId };
        if (colsU.has('nome')) upd['nome'] = 'Usuário Cancelado';
        if (colsU.has('cnpj')) upd['cnpj'] = null;
        if (colsU.has('nome_fantasia')) upd['nome_fantasia'] = null;
        if (colsU.has('telefone')) upd['telefone'] = null;
        if (colsU.has('celular')) upd['celular'] = null;
        if (colsU.has('bio')) upd['bio'] = null;
        if (colsU.has('funcao_principal')) upd['funcao_principal'] = null;
        if (colsU.has('valor_hora_base')) upd['valor_hora_base'] = null;
        if (colsU.has('senha_hash')) upd['senha_hash'] = null; // NULLABLE agora - não usa mais, apaga no cancelamento
        if (colsU.has('senha')) upd['senha'] = null; // NULLABLE agora - não usa mais, apaga no cancelamento
        if (colsU.has('foto_url')) upd['foto_url'] = null;
        if (colsU.has('avatar_url')) upd['avatar_url'] = null;
        if (colsU.has('tem_mei')) upd['tem_mei'] = null;
        if (colsU.has('ativo')) upd['ativo'] = false;
        if (colsU.has('cancelado_em')) upd['cancelado_em'] = '__NOW__';
        if (colsU.has('cancelado_por')) upd['cancelado_por'] = 'PROPRIO_USUARIO_LINK';
        if (colsU.has('atualizado_em')) upd['atualizado_em'] = '__NOW__';
        // termos_aceitos NÃO existe em algumas tabelas e NÃO vai para o banco (regra anterior) - não inclui.
        const usarUpd = Object.entries(upd).filter(([c]) => colsU.has(c));
        if (!usarUpd.length) throw new Error('Tabela usuarios sem colunas para cancelar');
        // BUG que gerava 42P18 "$12": o placeholder usava o índice da entrada (i+1),
        // contando também os '__NOW__' que NÃO são parâmetros (viram NOW() no SQL).
        // Ex: cancelado_em=NOW() contava como $11, atualizado_em=NOW() como $12,
        // mas vals só tinha 11 valores -> o $12 ficava sem tipo -> 42P18.
        // CORREÇÃO: contador próprio, só incrementa para valores reais.
        const valsUpd: any[] = [];
        let paramIdx = 1;
        const setsUpd = usarUpd.map(([c, v]) => {
          if (v === '__NOW__') return `${c}=NOW()`;
          valsUpd.push(v);
          return `${c}=$${paramIdx++}`;
        }).join(', ');
        valsUpd.push(usuarioId);
        console.log(`[cancelarCadastro] UPDATE usuarios id=${usuarioId} sets=[${setsUpd}] params=${valsUpd.length}`);
        await client.query(`UPDATE usuarios SET ${setsUpd} WHERE id=$${paramIdx}`, valsUpd);
        await client.query(`DELETE FROM enderecos WHERE usuario_id=$1`, [usuarioId]);
        await client.query(`UPDATE candidaturas SET status='CANCELADA' WHERE (freela_id=$1 OR usuario_id=$1) AND status IN ('PENDENTE','ACEITA')`, [usuarioId]).catch(() => {});
        await client.query('COMMIT');
        console.log(`[cancelarCadastro] OK usuario=${usuarioId} ${emailNorm} -> ${emailAnonimizado} cpf -> ${cpfAnonimizado}`);
        return res.json({ success: true, message: 'Cadastro cancelado. Seus dados foram apagados e seu e-mail e CPF foram liberados para um novo cadastro.', usuario_id: usuarioId, email_anonimizado: emailAnonimizado });
      } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('[cancelarCadastro] rollback:', e);
        return this.error(res, e.message || 'Erro ao cancelar cadastro', 400);
      } finally { client.release(); }
    } catch (e: any) { console.error('[cancelarCadastro]', e); return this.handleError(res, e); }
  };
}
