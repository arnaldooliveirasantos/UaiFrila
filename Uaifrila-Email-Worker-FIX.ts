import { Pool } from 'pg';
import nodemailer from 'nodemailer';

const pool = new Pool({
  user: process.env.DB_USER || 'email_worker_user',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'uaifrila',
  max: 5
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function buscarEmailsPendentes() {
  // QUERY CORRIGIDA: t.email_remetente vem de email_templates, h.tentativas de email_historico_disparos
  const query = `
    SELECT 
      h.id,
      h.email_destinatario,
      h.titulo_final,
      h.conteudo_final,
      h.codigo_verificacao,
      h.tentativas,
      h.ultimo_erro,
      h.email_remetente as h_email_remetente,
      t.chave_uso,
      t.titulo_assunto,
      t.email_remetente as t_email_remetente,
      t.nome_remetente as t_nome_remetente,
      COALESCE(h.email_remetente, t.email_remetente, 'noreply@uaifrila.com.br') as remetente_final,
      COALESCE(t.nome_remetente, 'UAI FRILA') as nome_remetente_final
    FROM email_historico_disparos h
    LEFT JOIN email_templates t ON t.id = h.template_id
    LEFT JOIN email_status s ON s.id = h.status_id
    WHERE 
      h.tentativas < 3 
      AND (s.chave = 'EM_ESPERA' OR h.status_id IS NULL)
      AND h.enviado_em IS NULL
      AND h.expira_em > NOW()
    ORDER BY h.criado_em ASC
    LIMIT 10
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (e:any) {
    console.error('❌ Erro buscar emails:', e.message);
    if (e.message.includes('tentativas') || e.message.includes('email_remetente')) {
      console.error('⚠️ Rode FIX_email_templates_remetente.sql como postgres!');
    }
    return [];
  }
}

async function enviarEmail(emailData: any) {
  const remetente = emailData.remetente_final || emailData.t_email_remetente || 'noreply@uaifrila.com.br';
  const nomeRemetente = emailData.nome_remetente_final || emailData.t_nome_remetente || 'UAI FRILA';

  console.log(`📧 Enviando para ${emailData.email_destinatario} de ${remetente} (${nomeRemetente}) - Template: ${emailData.chave_uso}`);

  try {
    const info = await transporter.sendMail({
      from: `"${nomeRemetente}" <${remetente}>`,
      to: emailData.email_destinatario,
      subject: emailData.titulo_final || emailData.titulo_assunto,
      html: emailData.conteudo_final,
      text: emailData.conteudo_final.replace(/<[^>]*>/g, '')
    });

    console.log(`✅ Email enviado: ${info.messageId} para ${emailData.email_destinatario}`);

    // Atualiza como enviado
    await pool.query(`
      UPDATE email_historico_disparos 
      SET 
        tentativas = tentativas + 1,
        enviado_em = NOW(),
        ultima_tentativa = NOW(),
        status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'),
        ultimo_erro = NULL
      WHERE id = $1
    `, [emailData.id]);

    return true;
  } catch (e:any) {
    console.error(`❌ Erro ao enviar para ${emailData.email_destinatario}:`, e.message);

    await pool.query(`
      UPDATE email_historico_disparos 
      SET 
        tentativas = tentativas + 1,
        ultimo_erro = $2,
        ultima_tentativa = NOW(),
        status_id = CASE 
          WHEN tentativas >= 2 THEN (SELECT id FROM email_status WHERE chave = 'ERRO')
          ELSE status_id
        END
      WHERE id = $1
    `, [emailData.id, e.message.substring(0, 500)]);

    return false;
  }
}

async function workerLoop() {
  console.log('🚀 uaifrila-email-worker iniciado - Aguardando emails...');
  
  while (true) {
    try {
      const emails = await buscarEmailsPendentes();
      
      if (emails.length === 0) {
        // console.log('💤 Nenhum email pendente, aguardando 5s...');
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      console.log(`📬 Encontrados ${emails.length} emails pendentes`);

      for (const email of emails) {
        await enviarEmail(email);
        await new Promise(r => setTimeout(r, 1000)); // 1s entre envios
      }

    } catch (e:any) {
      console.error('🔥 Erro no loop do worker:', e.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

workerLoop().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Parando worker...');
  await pool.end();
  process.exit(0);
});
