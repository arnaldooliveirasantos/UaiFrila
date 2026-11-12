import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import { WorkerLogger, mascararEmail } from './Logger';
const pool = new Pool({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 5432, database: process.env.DB_NAME, max: 5 });
const log = new WorkerLogger(pool);
const transportador = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
const INTERVAL = Number(process.env.WORKER_INTERVAL_MS) || 10000;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 10;
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;
let isProcessing = false;
async function tick() {
  if (isProcessing) { await log.warn('tick ignorado: anterior ainda em execucao'); return; }
  isProcessing = true;
  const client = await pool.connect();
  try {
    await log.info('tick inicio', { batch: BATCH });
    // Trava + envio + marcacao dentro de UMA transacao por lote. Antes: FOR UPDATE fora de transacao (lock liberado) + retry infinito sem teto.
    await client.query('BEGIN');
    const emEspera = await client.query(`WITH locked AS (SELECT id FROM email_historico_disparos WHERE status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND enviado_em IS NULL ORDER BY criado_em ASC LIMIT $1::int FOR UPDATE SKIP LOCKED) SELECT h.id,h.email_destinatario,h.titulo_final,h.conteudo_final,h.expira_em,h.criado_em,$2::text AS email_remetente,COALESCE(t.nome_remetente,'UaiFrila') AS nome_remetente FROM email_historico_disparos h JOIN locked ON locked.id=h.id LEFT JOIN email_templates t ON h.template_id=t.id`, [BATCH, process.env.SMTP_USER || 'noreply@uaifrila.com.br']);
    await log.info('em_espera encontrados', { qtd: emEspera.rows.length });
    for (const linha of emEspera.rows) {
      try {
        const v = await client.query(`SELECT $1::timestamp > NOW() AS valido`, [linha.expira_em]);
        if (!v.rows[0].valido) { await log.info('expirado, nao envia', { id: linha.id, destinatario: mascararEmail(linha.email_destinatario) }); continue; }
        await log.info('enviando', { id: linha.id, destinatario: mascararEmail(linha.email_destinatario) });
        await transportador.sendMail({ from: `"${linha.nome_remetente}" <${linha.email_remetente}>`, to: linha.email_destinatario, subject: linha.titulo_final, html: linha.conteudo_final });
        await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='ENVIADO'), enviado_em=NOW(), atualizado_em=NOW(), ultima_tentativa=NOW(), tentativas=tentativas+1, ultimo_erro=NULL WHERE id=$1`, [linha.id]);
        await log.info('enviado', { id: linha.id });
      } catch (err: any) {
        await log.error('falha no envio', { id: linha.id, erro: String(err?.message || err).slice(0, 500) });
        await client.query(`UPDATE email_historico_disparos SET tentativas=tentativas+1, ultimo_erro=$1, ultima_tentativa=NOW(), status_id=CASE WHEN tentativas+1 >= $3 THEN (SELECT id FROM email_status WHERE chave='FALHA') ELSE status_id END WHERE id=$2`, [String(err?.message || err).slice(0, 500), linha.id, MAX_TENTATIVAS]);
      }
    }
    const expirados = await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW(), ultimo_erro='Expirado: criado_em < NOW() - 15min' WHERE status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND criado_em < NOW() - INTERVAL '15 minutes' RETURNING id`);
    if (expirados.rows.length) await log.info('expirados', { qtd: expirados.rows.length });
    await client.query('COMMIT');
    await log.info('tick fim ok');
  } catch (e: any) { try { await client.query('ROLLBACK'); } catch {} await log.error('tick falhou, rollback', { erro: String(e?.message || e).slice(0, 500) }); }
  finally { client.release(); isProcessing = false; }
}
log.info('worker iniciado', { intervalMs: INTERVAL, batch: BATCH, maxTentativas: MAX_TENTATIVAS });
tick(); setInterval(tick, INTERVAL);
