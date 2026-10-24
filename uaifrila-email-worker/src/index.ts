import { Pool } from "pg";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * FIX para consulta do index.js
 * Antes (com erro):
 * SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final, h.tentativas, t.email_remetente, t.nome_exibicao
 * FROM email_historico_disparos h JOIN email_templates t ON h.template_id = t.id
 * WHERE h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
 * ORDER BY h.criado_em ASC LIMIT 5
 *
 * Erros:
 * - h.tentativas não existe (se não rodou FIX SQL)
 * - t.email_remetente não existe em email_templates
 * - t.nome_exibicao pode ser nome_remetente
 *
 * Depois (corrigida):
 */

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 3,
});

const transportador = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
    // Expira vencidos
    await client.query(
      `UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW() WHERE status_id=(SELECT id FROM email_status WHERE chave='EM_ESPERA') AND expira_em < NOW()`,
    );

    // QUERY CORRIGIDA - ESTA É A CORREÇÃO DA SUA CONSULTA:
    const res = await client.query(
      `
      SELECT 
        h.id, 
        h.email_destinatario, 
        h.titulo_final, 
        h.conteudo_final, 
        h.tentativas, -- FIX: agora existe
        h.email_remetente as h_email_remetente,
        COALESCE(t.email_remetente, h.email_remetente, 'noreply@uaifrila.com.br') as email_remetente_final, -- FIX: t.email_remetente vem de email_templates
        COALESCE(t.nome_remetente, t.nome_exibicao, 'UAI FRILA') as nome_exibicao_final, -- FIX: compatibilidade nome_exibicao / nome_remetente
        t.email_remetente as t_email_remetente,
        t.nome_exibicao,
        t.nome_remetente,
        t.chave_uso
      FROM email_historico_disparos h 
      JOIN email_templates t ON h.template_id = t.id 
      WHERE 
        h.status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA') 
        AND h.tentativas < $2
        AND (h.expira_em IS NULL OR h.expira_em > NOW())
        AND h.enviado_em IS NULL
      ORDER BY h.criado_em ASC 
      LIMIT $1 
      FOR UPDATE SKIP LOCKED
    `,
      [BATCH, MAX_TENTATIVAS],
    );

    for (const linha of res.rows) {
      try {
        // Usa t.email_remetente da tabela email_templates
        const from = `"${linha.nome_exibicao_final}" <${linha.email_remetente_final}>`;
        await transportador.sendMail({
          from,
          to: linha.email_destinatario,
          subject: linha.titulo_final,
          html: linha.conteudo_final,
        });
        await client.query(
          `UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='ENVIADO'), enviado_em=NOW(), atualizado_em=NOW(), ultima_tentativa=NOW(), tentativas=tentativas+1 WHERE id=$1`,
          [linha.id],
        );
        console.log(
          `✅ Enviado ${linha.id} para ${linha.email_destinatario} de ${from}`,
        );
      } catch (err: any) {
        const nt = (linha.tentativas || 0) + 1;
        if (nt >= MAX_TENTATIVAS) {
          await client.query(
            `UPDATE email_historico_disparos SET tentativas=$1, erro_mensagem=$2, ultimo_erro=$2, status_id=(SELECT id FROM email_status WHERE chave='EXPIRADO'), atualizado_em=NOW(), ultima_tentativa=NOW() WHERE id=$3`,
            [nt, err.message.substring(0, 500), linha.id],
          );
        } else {
          await client.query(
            `UPDATE email_historico_disparos SET tentativas=$1, erro_mensagem=$2, ultimo_erro=$2, atualizado_em=NOW(), ultima_tentativa=NOW() WHERE id=$3`,
            [nt, err.message.substring(0, 500), linha.id],
          );
        }
        console.error(`❌ [${linha.id}] Erro: ${err.message}`);
      }
    }
  } catch (e: any) {
    console.error("🔥 Erro tick:", e.message);
    if (
      e.message.includes("tentativas") ||
      e.message.includes("email_remetente")
    ) {
      console.error(
        "💡 Rode FIX SQL: psql -U postgres -d uai_frila -f FIX_FINAL_EMAIL_WORKER.sql",
      );
    }
  } finally {
    client.release();
    isProcessing = false;
  }
}

console.log(
  "🚀 Email Worker v14.0 iniciado - QUERY CORRIGIDA: t.email_remetente de email_templates + h.tentativas + FOR UPDATE SKIP LOCKED",
);
tick();
setInterval(tick, INTERVAL);
