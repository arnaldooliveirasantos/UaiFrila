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
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
async function processarFilaEmails() {
    const client = new pg_1.Client({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME });
    try {
        await client.connect();
        const queryFila = `
            SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final, h.tentativas, t.email_remetente, t.nome_exibicao
            FROM email_historico_disparos h JOIN email_templates t ON h.template_id = t.id
            WHERE h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
            ORDER BY h.criado_em ASC LIMIT 5
        `;
        const resultado = await client.query(queryFila);
        for (const linha of resultado.rows) {
            try {
                await transportador.sendMail({ from: `"${linha.nome_exibicao}" <${linha.email_remetente}>`, to: linha.email_destinatario, subject: linha.titulo_final, html: linha.conteudo_final });
                await client.query("UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'), atualizado_em = NOW() WHERE id = $1", [linha.id]);
            }
            catch (err) {
                await client.query("UPDATE email_historico_disparos SET tentativas = $1, erro_mensagem = $2, atualizado_em = NOW() WHERE id = $3", [linha.tentativas + 1, err.message, linha.id]);
            }
        }
    }
    catch (error) {
        console.error(error.message);
    }
    finally {
        await client.end();
    }
}
console.log('🚀 [Worker] Monitoramento Iniciado!');
setInterval(async () => { await processarFilaEmails(); }, 10000);
