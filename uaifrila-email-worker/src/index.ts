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
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// FIX NaN: garante fallback se .env não tiver WORKER_BATCH_SIZE
const INTERVAL = Number(process.env.WORKER_INTERVAL_MS) || 10000;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 5;
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;

console.log(`🔧 Config: BATCH=${BATCH} MAX_TENTATIVAS=${MAX_TENTATIVAS} INTERVAL=${INTERVAL} SMTP_USER=${process.env.SMTP_USER}`);

let isProcessing = false;

async function tick() {
  if (isProcessing) return;
  isProcessing = true;
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE email_historico_disparos 
      SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW() 
      WHERE status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND expira_em < NOW()
    `);

    // email_remetente = SMTP_USER do .env (sem fallback)
    const res = await client.query(`
      SELECT 
        h.id, 
        h.email_destinatario, 
        h.titulo_final, 
        h.conteudo_final, 
        h.tentativas,
        $3::text as email_remetente,
        t.nome_remetente,
        t.chave_uso
      FROM email_historico_disparos h 
      JOIN email_templates t ON h.template_id = t.id 
      WHERE 
        h.status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA') 
        AND h.tentativas < $2::int
        AND h.enviado_em IS NULL
        AND (h.expira_em IS NULL OR h.expira_em > NOW())
      ORDER BY h.criado_em ASC 
      LIMIT $1::int
      FOR UPDATE SKIP LOCKED
    `, [BATCH, MAX_TENTATIVAS, process.env.SMTP_USER]);

    if (res.rows.length === 0) return;

    console.log(`📬 ${res.rows.length} email(s) pendente(s) - remetente: ${process.env.SMTP_USER}`);

    for (const linha of res.rows) {
      try {
        console.log(`📧 [${linha.id}] ${linha.chave_uso} -> ${linha.email_destinatario} de ${linha.nome_remetente} <${linha.email_remetente}>`);

        await transportador.sendMail({
          from: `"${linha.nome_remetente}" <${linha.email_remetente}>`,
          to: linha.email_destinatario,
          subject: linha.titulo_final,
          html: linha.conteudo_final
        });

        await client.query(`
          UPDATE email_historico_disparos 
          SET status_id=(SELECT id FROM email_status WHERE chave='ENVIADO'), 
              enviado_em=NOW(), 
              atualizado_em=NOW(), 
              ultima_tentativa=NOW(), 
              tentativas=tentativas+1,
              email_remetente=$2::text
          WHERE id=$1::int
        `, [linha.id, linha.email_remetente]);

        console.log(`✅ [${linha.id}] Enviado de ${linha.email_remetente}`);

      } catch (err: any) {
        const nt = linha.tentativas + 1;
        console.error(`❌ [${linha.id}] Erro: ${err.message}`);
        await client.query(`
          UPDATE email_historico_disparos 
          SET tentativas=$1::int, 
              ultimo_erro=$2::text,
              atualizado_em=NOW(), 
              ultima_tentativa=NOW(),
              status_id = CASE WHEN $1::int >= $3::int THEN (SELECT id FROM email_status WHERE chave='EXPIRADO') ELSE status_id END
          WHERE id=$4::int
        `, [nt, err.message.substring(0,500), MAX_TENTATIVAS, linha.id]);
      }
    }
  } catch (e: any) {
    console.error('🔥 Erro tick:', e.message);
    throw e;
  } finally {
    client.release();
    isProcessing = false;
  }
}

console.log(`🚀 Email Worker - email_remetente = SMTP_USER (${process.env.SMTP_USER}) - SEM FALLBACK de tabela`);
tick();
setInterval(tick, INTERVAL);
