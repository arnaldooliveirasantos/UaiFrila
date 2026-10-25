-- =====================================================================
-- EMAIL WORKER FIX - uaifrila-email-worker
-- Query corrigida com t.email_remetente vindo de email_templates
-- =====================================================================

-- QUERY ANTIGA (com erro):
-- SELECT h.*, h.tentativas FROM email_historico_disparos h WHERE h.tentativas < 3
-- Erro: coluna h.tentativas não existe, e t.email_remetente não existe

-- QUERY NOVA CORRIGIDA (use esta no seu email worker):

SELECT 
  h.id,
  h.template_id,
  h.email_destinatario,
  h.titulo_final,
  h.conteudo_final,
  h.codigo_verificacao,
  h.status_id,
  h.tentativas, -- agora existe
  h.ultimo_erro,
  h.ultima_tentativa,
  h.enviado_em,
  t.id as template_id_real,
  t.chave_uso,
  t.titulo_assunto,
  t.conteudo_corpo,
  t.email_remetente, -- FIX PRINCIPAL: t.email_remetente vem de email_templates
  t.nome_remetente ,
  COALESCE(h.email_remetente, t.email_remetente, 'noreply@uaifrila.com.br') as remetente_final,
  s.chave as status_chave,
  s.nome as status_nome,
  t.nome_exibicao
FROM email_historico_disparos h
LEFT JOIN email_templates t ON t.id = h.template_id
LEFT JOIN email_status s ON s.id = h.status_id
WHERE 
  h.tentativas < 3 
  AND (h.status_id = (SELECT id FROM email_status WHERE chave = 'EM_ESPERA') OR h.status_id IS NULL)
  AND h.enviado_em IS NULL
ORDER BY h.criado_em ASC
LIMIT 10;

-- Para atualizar após envio bem-sucedido:
-- UPDATE email_historico_disparos SET tentativas = tentativas + 1, enviado_em = NOW(), status_id = (SELECT id FROM email_status WHERE chave = 'ENVIADO'), ultima_tentativa = NOW() WHERE id = $1;

-- Para erro:
-- UPDATE email_historico_disparos SET tentativas = tentativas + 1, ultimo_erro = $2, ultima_tentativa = NOW() WHERE id = $1;
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
        t.chave_uso,
        h.status_id 
      FROM email_historico_disparos h 
      JOIN email_templates t ON h.template_id = t.id 
      WHERE 
        h.status_id = (SELECT id FROM email_status WHERE chave='EM_ESPERA') 
        AND h.tentativas <1 $2
        AND (h.expira_em IS NULL OR h.expira_em > NOW())
        AND h.enviado_em IS NULL
      ORDER BY h.criado_em ASC 
      LIMIT $1 
      FOR UPDATE SKIP locked
      
      SELECT * FROM email_status