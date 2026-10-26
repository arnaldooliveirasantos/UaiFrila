import { Pool } from 'pg';
const nodemailer = require('nodemailer');
import dotenv from 'dotenv';
dotenv.config();
import { config } from './config/env';

const pool = new Pool({
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  max: 5
});

const transportador = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS
  }
});

const INTERVAL = config.WORKER_INTERVAL_MS;
const BATCH = config.WORKER_BATCH_SIZE;
const MAX_TENTATIVAS = config.MAX_TENTATIVAS;

console.log(`🔧 Config: BATCH=${BATCH} MAX_TENTATIVAS=${MAX_TENTATIVAS} INTERVAL=${INTERVAL} SMTP_USER=${config.SMTP_USER}`);

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

    try {
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP`);
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultima_tentativa TIMESTAMP`);
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW()`);
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS tentativas INT DEFAULT 0`);
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultimo_erro TEXT`);
      await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS email_remetente VARCHAR(150)`);
    } catch {}

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
        AND (h.enviado_em IS NULL OR h.enviado_em IS NOT NULL AND h.status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA'))
        AND (h.expira_em IS NULL OR h.expira_em > NOW())
      ORDER BY h.criado_em ASC 
      LIMIT $1::int
      FOR UPDATE SKIP LOCKED
    `, [BATCH, MAX_TENTATIVAS, config.SMTP_USER]);

    if (res.rows.length === 0) return;

    console.log(`📬 ${res.rows.length} email(s) pendente(s) - remetente: ${config.SMTP_USER}`);

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
        const nt = (linha.tentativas || 0) + 1;
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

console.log(`🚀 Email Worker - email_remetente = SMTP_USER (${config.SMTP_USER}) - SEM FALLBACK, .env obrigatório`);
tick();
setInterval(tick, INTERVAL);
