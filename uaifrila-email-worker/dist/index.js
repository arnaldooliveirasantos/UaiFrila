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

const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS) || 3;

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
        
        // QUERY CORRIGIDA - FIX para h.tentativas e t.email_remetente
        // Antes dava erro: coluna h.tentativas não existe, t.email_remetente não existe
        // Agora:
        // - h.tentativas existe (criada pelo FIX SQL)
        // - t.email_remetente busca de email_templates (com COALESCE fallback)
        // - t.nome_exibicao com fallback para nome_remetente
        // - Adiciona filtro tentativas < MAX e expira_em
        // - Adiciona FOR UPDATE SKIP LOCKED para evitar concorrência
        const queryFila = `
            SELECT 
                h.id, 
                h.email_destinatario, 
                h.titulo_final, 
                h.conteudo_final, 
                h.tentativas,
                h.email_remetente as h_email_remetente,
                COALESCE(t.email_remetente, h.email_remetente, 'noreply@uaifrila.com.br') as email_remetente_final,
                COALESCE(t.nome_remetente, t.nome_exibicao, 'UAI FRILA') as nome_exibicao_final,
                t.email_remetente as t_email_remetente,
                t.nome_exibicao,
                t.nome_remetente,
                t.chave_uso
            FROM email_historico_disparos h 
            JOIN email_templates t ON h.template_id = t.id
            WHERE 
                h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA')
                AND h.tentativas < $1
                AND (h.expira_em IS NULL OR h.expira_em > NOW())
                AND h.enviado_em IS NULL
            ORDER BY h.criado_em ASC 
            LIMIT 5
            FOR UPDATE SKIP LOCKED
        `;
        
        const resultado = await client.query(queryFila, [MAX_TENTATIVAS]);
        
        console.log(`📬 ${resultado.rows.length} email(s) pendente(s)`);
        
        for (const linha of resultado.rows) {
            try {
                // Usa t.email_remetente vindo de email_templates (FIX PRINCIPAL)
                const from = `"${linha.nome_exibicao_final}" <${linha.email_remetente_final}>`;
                console.log(`📧 Enviando [${linha.id}] ${linha.chave_uso} para ${linha.email_destinatario} de ${from}`);
                
                await transportador.sendMail({ 
                    from, 
                    to: linha.email_destinatario, 
                    subject: linha.titulo_final, 
                    html: linha.conteudo_final 
                });
                
                await client.query(`
                    UPDATE email_historico_disparos 
                    SET 
                        status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'), 
                        enviado_em = NOW(),
                        atualizado_em = NOW(),
                        ultima_tentativa = NOW(),
                        tentativas = tentativas + 1,
                        ultimo_erro = NULL,
                        erro_mensagem = NULL
                    WHERE id = $1
                `, [linha.id]);
                
                console.log(`✅ [${linha.id}] Enviado para ${linha.email_destinatario}`);
                
            } catch (err) {
                console.error(`❌ [${linha.id}] Erro:`, err.message);
                // Atualiza ambos erro_mensagem e ultimo_erro para compatibilidade
                await client.query(`
                    UPDATE email_historico_disparos 
                    SET 
                        tentativas = $1, 
                        ultimo_erro = $2,
                        erro_mensagem = $2, 
                        atualizado_em = NOW(),
                        ultima_tentativa = NOW(),
                        status_id = CASE 
                            WHEN $1 >= $4 THEN (SELECT id FROM email_status WHERE chave = 'EXPIRADO')
                            ELSE status_id
                        END
                    WHERE id = $3
                `, [linha.tentativas + 1, err.message.substring(0,500), linha.id, MAX_TENTATIVAS]);
            }
        }
    }
    catch (error) {
        console.error('🔥 Erro processar fila:', error.message);
        if (error.message.includes('tentativas') || error.message.includes('email_remetente')) {
            console.error('💡 Rode: psql -U postgres -d uai_frila -f FIX_FINAL_EMAIL_WORKER.sql');
        }
    }
    finally {
        await client.end();
    }
}

console.log('🚀 [Worker] Monitoramento Iniciado! v14.0 FIX - t.email_remetente de email_templates + h.tentativas');
processarFilaEmails();
setInterval(async () => { await processarFilaEmails(); }, 10000);
