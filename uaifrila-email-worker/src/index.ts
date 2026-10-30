
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 5
});

const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const INTERVAL = Number(process.env.WORKER_INTERVAL_MS) || 10000;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 10;

console.log(`Worker v16.1 - FIX: Não expira sem passar o tempo`);

let isProcessing = false;

async function tick() {
  if (isProcessing) return;
  isProcessing = true;
  const client = await pool.connect();
  try {
    // PASSO 1: Envia TODOS EM_ESPERA primeiro - mesmo que expira_em esteja perto
    const emEspera = await client.query(`
      WITH locked AS (
        SELECT id FROM email_historico_disparos
        WHERE status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA')
          AND enviado_em IS NULL
        ORDER BY criado_em ASC LIMIT $1::int FOR UPDATE SKIP LOCKED
      )
      SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final,
             h.codigo_verificacao, h.expira_em, h.criado_em,
             $2::text as email_remetente, COALESCE(t.nome_remetente, 'UaiFrila') as nome_remetente
      FROM email_historico_disparos h
      JOIN locked ON locked.id = h.id
      LEFT JOIN email_templates t ON h.template_id = t.id
    `, [BATCH, process.env.SMTP_USER || 'noreply@uaifrila.com.br']);

    console.log(`[PASSO 1] ${emEspera.rows.length} EM_ESPERA para enviar`);

    for (const linha of emEspera.rows) {
      try {
        // Verifica se ainda é válido antes de enviar (expira_em > NOW())
        const valido = await client.query(`SELECT $1::timestamp > NOW() as valido, EXTRACT(EPOCH FROM ($1::timestamp - NOW()))/60 as minutos`, [linha.expira_em]);
        const minutos = valido.rows[0].minutos;
        
        if (!valido.rows[0].valido) {
          console.log(`   [${linha.id}] Código ${linha.codigo_verificacao} já expirou (expira:${linha.expira_em} rest:${minutos ? minutos.toFixed(1) : 'NULL'}min) - não envia, vai expirar no PASSO 2`);
          continue;
        }

        console.log(`   [${linha.id}] Enviando para ${linha.email_destinatario} cod:${linha.codigo_verificacao} rest:${minutos ? minutos.toFixed(1) : 'NULL'}min`);
        await transportador.sendMail({
          from: `"${linha.nome_remetente}" <${linha.email_remetente}>`,
          to: linha.email_destinatario,
          subject: linha.titulo_final,
          html: linha.conteudo_final
        });

        await client.query(`
          UPDATE email_historico_disparos 
          SET status_id = (SELECT id FROM email_status WHERE chave='ENVIADO'),
              enviado_em = NOW(), atualizado_em = NOW(), ultima_tentativa = NOW(), tentativas = tentativas + 1, ultimo_erro = NULL
          WHERE id = $1
        `, [linha.id]);
        console.log(`   ✅ [${linha.id}] ENVIADO marcado como ENVIADO`);

      } catch (err: any) {
        console.error(`   ❌ [${linha.id}] Erro: ${err.message}`);
        await client.query(`UPDATE email_historico_disparos SET tentativas = tentativas + 1, ultimo_erro = $1, ultima_tentativa = NOW() WHERE id = $2`, [err.message.substring(0,500), linha.id]);
      }
    }

    // PASSO 2: Expira só quem realmente passou do tempo COM MARGEM DE 1 MINUTO
    // Isso evita expirar "sem passar o tempo" por causa de diferença de relógio
    const expirados = await client.query(`
      UPDATE email_historico_disparos 
      SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO'),
          atualizado_em = NOW(),
          ultimo_erro = 'Expirado: expira_em < NOW() - grace 1min'
      WHERE status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA')
        AND expira_em IS NOT NULL
        AND expira_em < NOW() - INTERVAL '1 minute'
      RETURNING id, email_destinatario, codigo_verificacao, expira_em
    `);

    if (expirados.rows.length > 0) {
      console.log(`[PASSO 2] ${expirados.rows.length} expirados (expira_em < NOW() - 1min): ${expirados.rows.map(r=>r.codigo_verificacao).join(',')}`);
    }

    const status = await client.query(`SELECT s.chave, COUNT(*) as qtd FROM email_historico_disparos h JOIN email_status s ON s.id=h.status_id GROUP BY s.chave`);
    console.log(`Status: ${status.rows.map(r=>`${r.chave}:${r.qtd}`).join(' | ')}`);

  } catch (e: any) {
    console.error('Erro:', e.message, e.stack);
  } finally {
    client.release();
    isProcessing = false;
  }
}

console.log(`Worker v16.1 - Não expira sem passar o tempo (grace 1min)`);
tick();
setInterval(tick, INTERVAL);
