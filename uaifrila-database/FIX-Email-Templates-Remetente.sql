-- =====================================================================
-- FIX PARA: t.email_remetente deve buscar da tabela email_templates
-- E FIX para h.tentativas não existe
-- Rode como postgres superuser
-- =====================================================================

-- psql -U postgres -d uaifrila -f FIX_email_templates_remetente.sql

-- 1. ADICIONA email_remetente NA TABELA email_templates
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS email_remetente VARCHAR(150) DEFAULT 'noreply@uaifrila.com.br';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS nome_remetente VARCHAR(150) DEFAULT 'UAI FRILA';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS reply_to VARCHAR(150);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- 2. ADICIONA COLUNAS FALTANTES EM email_historico_disparos (fix tentativas)
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS tentativas INT DEFAULT 0 NOT NULL;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultima_tentativa TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS status_envio VARCHAR(20) DEFAULT 'PENDENTE';
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS email_remetente VARCHAR(150);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS template_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS expira_em TIMESTAMP;

-- 3. ATUALIZA TEMPLATES EXISTENTES COM REMETENTE
UPDATE email_templates SET email_remetente = 'noreply@uaifrila.com.br', nome_remetente = 'UAI FRILA' WHERE email_remetente IS NULL;

INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente) VALUES
('CONFIRMACAO_CADASTRO', 'Confirme seu cadastro - UAI FRILA', 'Olá {{NOME}}, seu código é {{CODIGO}}. E-mail: {{EMAIL}}', 'noreply@uaifrila.com.br', 'UAI FRILA'),
('2FA_LOGIN', 'Código de login - UAI FRILA', 'Seu código de login é {{CODIGO}}', 'noreply@uaifrila.com.br', 'UAI FRILA'),
('RECUPERACAO_SENHA', 'Recuperação de senha - UAI FRILA', 'Olá {{NOME}}, seu código de recuperação é {{CODIGO}}', 'noreply@uaifrila.com.br', 'UAI FRILA'),
('BOAS_VINDAS', 'Bem-vindo ao UAI FRILA', 'Olá {{NOME}}, bem-vindo!', 'contato@uaifrila.com.br', 'UAI FRILA Equipe')
ON CONFLICT (chave_uso) DO UPDATE SET 
  email_remetente = EXCLUDED.email_remetente,
  nome_remetente = EXCLUDED.nome_remetente;

-- 4. PERMISSÕES PARA OS 3 USUARIOS
GRANT ALL PRIVILEGES ON TABLE email_templates TO uaifrila_user;
GRANT ALL PRIVILEGES ON TABLE email_templates TO uai_frila_app;
GRANT ALL PRIVILEGES ON TABLE email_templates TO email_worker_user;
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO uaifrila_user;
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO uai_frila_app;
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO email_worker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uaifrila_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uai_frila_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO email_worker_user;

-- 5. VERIFICAÇÃO
SELECT '=== email_templates com remetente ===' as info;
SELECT id, chave_uso, email_remetente, nome_remetente, titulo_assunto FROM email_templates ORDER BY id;

SELECT '=== email_historico_disparos com tentativas e remetente ===' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'email_historico_disparos' 
AND column_name IN ('tentativas', 'ultimo_erro', 'email_remetente', 'enviado_em')
ORDER BY column_name;

-- TESTE DA QUERY QUE O WORKER USA (com t.email_remetente e h.tentativas)
SELECT 
  h.id,
  h.email_destinatario,
  h.tentativas,
  h.ultimo_erro,
  t.chave_uso,
  t.email_remetente as t_email_remetente, -- AQUI ESTÁ O FIX: t.email_remetente vem de email_templates
  t.nome_remetente,
  t.titulo_assunto,
  h.titulo_final,
  h.criado_em
FROM email_historico_disparos h
LEFT JOIN email_templates t ON t.id = h.template_id
WHERE h.tentativas < 3
ORDER BY h.criado_em DESC
LIMIT 5;

\echo '✅ FIX APLICADO - t.email_remetente agora vem de email_templates'
