"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();

const transportador = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// FIX NaN - garante número válido mesmo se .env incompleto
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;
const BATCH = Number(process.env.WORKER_BATCH_SIZE) || 5;

console.log(`🔧 Config: BATCH=${BATCH} MAX_TENTATIVAS=${MAX_TENTATIVAS} SMTP_USER=${process.env.SMTP_USER}`);

async function processarFilaEmails() {
    const client = new pg_1.Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME
    });
    try {
        await client.connect();
        try {
            await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP`);
            await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultima_tentativa TIMESTAMP`);
            await client.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW()`);
        } catch {}
        const queryFila = `
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
                h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
                AND h.tentativas < $2::int
                AND (h.enviado_em IS NULL OR h.enviado_em IS NOT NULL AND h.status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA'))
                AND (h.expira_em IS NULL OR h.expira_em > NOW())
            ORDER BY h.criado_em ASC 
            LIMIT $1::int
            FOR UPDATE SKIP LOCKED
        `;
        const resultado = await client.query(queryFila, [BATCH, MAX_TENTATIVAS, process.env.SMTP_USER]);
        if (resultado.rows.length === 0)
            return;
        console.log(`📬 ${resultado.rows.length} email(s) - remetente ${process.env.SMTP_USER}`);
        for (const linha of resultado.rows) {
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
                    SET status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'), 
                        enviado_em = NOW(), 
                        atualizado_em = NOW(), 
                        ultima_tentativa = NOW(), 
                        tentativas = tentativas + 1,
                        email_remetente=$2::text
                    WHERE id = $1::int
                `, [linha.id, linha.email_remetente]);
                console.log(`✅ [${linha.id}] Enviado de ${linha.email_remetente}`);
            }
            catch (err) {
                console.error(`❌ [${linha.id}] Erro:`, err.message);
                await client.query(`
                    UPDATE email_historico_disparos 
                    SET tentativas = $1::int, 
                        ultimo_erro = $2::text, 
                        atualizado_em = NOW(), 
                        ultima_tentativa = NOW(),
                        status_id = CASE WHEN $1::int >= $3::int THEN (SELECT id FROM email_status WHERE chave='EXPIRADO') ELSE status_id END
                    WHERE id = $4::int
                `, [linha.tentativas + 1, err.message.substring(0, 500), MAX_TENTATIVAS, linha.id]);
            }
        }
    }
    catch (error) {
        console.error('🔥 Erro:', error.message);
        throw error;
    }
    finally {
        await client.end();
    }
}
console.log(`🚀 Email Worker - email_remetente = SMTP_USER (${process.env.SMTP_USER}) - SEM FALLBACK`);
processarFilaEmails();
setInterval(async () => { await processarFilaEmails(); }, 10000);
