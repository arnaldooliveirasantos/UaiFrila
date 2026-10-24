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
    auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
    },
    tls: { rejectUnauthorized: false }
});

const INTERVAL = Number(process.env.WORKER_INTERVAL_MS) || 10000;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 5;
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;

async function marcarExpirados() {
    await pool.query(`
        UPDATE email_historico_disparos 
        SET status_id = (SELECT id FROM email_status WHERE chave = 'EXPIRADO'), 
            atualizado_em = NOW()
        WHERE status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
          AND expira_em < NOW()
    `);
}

async function processarFilaEmails() {
    const client = await pool.connect();
    try {
        // 1. Marca expirados antes de processar
        await marcarExpirados();

        const queryFila = `
            SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final, h.tentativas,
                   t.email_remetente, t.nome_exibicao
            FROM email_historico_disparos h 
            JOIN email_templates t ON h.template_id = t.id
            WHERE h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
              AND h.tentativas < $2
            ORDER BY h.criado_em ASC 
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        `;
        const resultado = await client.query(queryFila, [BATCH, MAX_TENTATIVAS]);
        
        if (resultado.rows.length === 0) return;

        console.log(`[Worker] Processando ${resultado.rows.length} e-mails...`);

        for (const linha of resultado.rows) {
            try {
                const info = await transportador.sendMail({
                    from: `"${linha.nome_exibicao}" <${linha.email_remetente}>`,
                    to: linha.email_destinatario,
                    subject: linha.titulo_final,
                    html: linha.conteudo_final
                });
                await client.query(
                    "UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'), atualizado_em = NOW(), erro_mensagem = NULL WHERE id = $1",
                    [linha.id]
                );
                console.log(`[Worker] ✅ Enviado ID ${linha.id} para ${linha.email_destinatario} - ${info.messageId}`);
            } catch (err: any) {
                const novaTentativa = linha.tentativas + 1;
                console.error(`[Worker] ❌ Falha ID ${linha.id} tentativa ${novaTentativa}:`, err.message);
                if (novaTentativa >= MAX_TENTATIVAS) {
                    await client.query(
                        "UPDATE email_historico_disparos SET tentativas = $1, erro_mensagem = $2, status_id = (SELECT id FROM email_status WHERE chave = 'EXPIRADO'), atualizado_em = NOW() WHERE id = $3",
                        [novaTentativa, err.message.substring(0, 500), linha.id]
                    );
                } else {
                    await client.query(
                        "UPDATE email_historico_disparos SET tentativas = $1, erro_mensagem = $2, atualizado_em = NOW() WHERE id = $3",
                        [novaTentativa, err.message.substring(0, 500), linha.id]
                    );
                }
            }
        }
    } catch (error: any) {
        console.error('[Worker] Erro no pool:', error.message);
    } finally {
        client.release();
    }
}

let isProcessing = false;

async function tick() {
    if (isProcessing) {
        console.log('[Worker] Tick ignorado - processamento anterior ainda em andamento');
        return;
    }
    isProcessing = true;
    try {
        await processarFilaEmails();
    } finally {
        isProcessing = false;
    }
}

console.log('🚀 [Worker] UAI FRILA Email Worker v12.2 Iniciado!');
console.log(`   Interval: ${INTERVAL}ms | Batch: ${BATCH} | Max Tentativas: ${MAX_TENTATIVAS}`);
console.log(`   DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} como ${process.env.DB_USER}`);

// Roda imediatamente e depois no intervalo
tick();
setInterval(tick, INTERVAL);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Worker] Encerrando...');
    await pool.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});
