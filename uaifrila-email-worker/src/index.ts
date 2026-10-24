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
  max: 3
});

const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const INTERVAL = Number(process.env.WORKER_INTERVAL_MS) || 10000;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 5;
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;
let isProcessing = false;

async function tick() {
  if (isProcessing) return;
  isProcessing = true;
  const client = await pool.connect();
  try {
    await client.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW() WHERE status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND expira_em < NOW()`);
    const res = await client.query(`SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final, h.tentativas, t.email_remetente, t.nome_exibicao FROM email_historico_disparos h JOIN email_templates t ON h.template_id=t.id WHERE h.status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND h.tentativas < $2 ORDER BY h.criado_em ASC LIMIT $1 FOR UPDATE SKIP LOCKED`, [BATCH, MAX_TENTATIVAS]);
    for (const linha of res.rows) {
      try {
        await transportador.sendMail({ from: `"${linha.nome_exibicao}" <${linha.email_remetente}>`, to: linha.email_destinatario, subject: linha.titulo_final, html: linha.conteudo_final });
        await client.query(`UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='ENVIADO'), atualizado_em=NOW() WHERE id=$1`, [linha.id]);
        console.log(`✅ Enviado ${linha.id} para ${linha.email_destinatario}`);
      } catch (err: any) {
        const nt = linha.tentativas+1;
        if (nt >= MAX_TENTATIVAS) await client.query(`UPDATE email_historico_disparos SET tentativas=$1, erro_mensagem=$2, status_id=(SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW() WHERE id=$3`, [nt, err.message.substring(0,500), linha.id]);
        else await client.query(`UPDATE email_historico_disparos SET tentativas=$1, erro_mensagem=$2, atualizado_em=NOW() WHERE id=$3`, [nt, err.message.substring(0,500), linha.id]);
      }
    }
  } catch (e: any) { console.error(e.message); } finally { client.release(); isProcessing=false; }
}

console.log('🚀 Email Worker v13.2 iniciado - FIX .js imports + Pool + SKIP LOCKED');
tick();
setInterval(tick, INTERVAL);
