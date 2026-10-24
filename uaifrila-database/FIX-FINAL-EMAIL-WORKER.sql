-- =====================================================================
-- FIX COMPLETO FINAL - Organiza email worker + corrige colunas
-- Rode como postgres: psql -U postgres -d uai_frila -f FIX_FINAL_EMAIL_WORKER.sql
-- =====================================================================

-- 1. FIX email_templates: adiciona email_remetente e nome_remetente
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS email_remetente VARCHAR(150) DEFAULT 'noreply@uaifrila.com.br';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS nome_remetente VARCHAR(150) DEFAULT 'UAI FRILA';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS nome_exibicao VARCHAR(150); -- compatibilidade com worker antigo que usa nome_exibicao
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS reply_to VARCHAR(150);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- Sincroniza nome_exibicao com nome_remetente para compatibilidade
UPDATE email_templates SET nome_exibicao = COALESCE(nome_remetente, nome_exibicao, 'UAI FRILA') WHERE nome_exibicao IS NULL;
UPDATE email_templates SET nome_remetente = COALESCE(nome_exibicao, nome_remetente, 'UAI FRILA') WHERE nome_remetente IS NULL;
UPDATE email_templates SET email_remetente = 'noreply@uaifrila.com.br' WHERE email_remetente IS NULL;

-- 2. FIX email_historico_disparos: todas colunas que worker usa
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS tentativas INT DEFAULT 0 NOT NULL;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS erro_mensagem TEXT; -- seu worker antigo usa erro_mensagem
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultima_tentativa TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS expira_em TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS email_remetente VARCHAR(150);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS template_id INT;

-- Sincroniza erro columns
UPDATE email_historico_disparos SET erro_mensagem = COALESCE(ultimo_erro, erro_mensagem) WHERE erro_mensagem IS NULL AND ultimo_erro IS NOT NULL;
UPDATE email_historico_disparos SET ultimo_erro = COALESCE(erro_mensagem, ultimo_erro) WHERE ultimo_erro IS NULL AND erro_mensagem IS NOT NULL;

-- 3. TEMPLATES padrão
INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente, nome_exibicao) VALUES
('CONFIRMACAO_CADASTRO', 'Confirme seu cadastro - UAI FRILA', '<h1>Olá {{NOME}}</h1><p>Seu código é <b>{{CODIGO}}</b></p>', 'noreply@uaifrila.com.br', 'UAI FRILA', 'UAI FRILA'),
('2FA_LOGIN', 'Código de login - UAI FRILA', '<h1>Seu código de login é <b>{{CODIGO}}</b></h1>', 'noreply@uaifrila.com.br', 'UAI FRILA', 'UAI FRILA')
ON CONFLICT (chave_uso) DO UPDATE SET 
  email_remetente = EXCLUDED.email_remetente,
  nome_remetente = EXCLUDED.nome_remetente,
  nome_exibicao = EXCLUDED.nome_exibicao;

-- 4. PERMISSÕES para os 3 usuários
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uaifrila_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uai_frila_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO email_worker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uaifrila_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uai_frila_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO email_worker_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uaifrila_user, uai_frila_app, email_worker_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uaifrila_user, uai_frila_app, email_worker_user;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO uaifrila_user, uai_frila_app, email_worker_user;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO uaifrila_user, uai_frila_app, email_worker_user;
/*
-- 5. VERIFICAÇÃO FINAL
SELECT '=== email_templates ===' as tabela;
SELECT id, chave_uso, email_remetente as t_email_remetente, nome_remetente, nome_exibicao FROM email_templates;

SELECT '=== email_historico_disparos colunas ===' as tabela;
SELECT column_name FROM information_schema.columns WHERE table_name='email_historico_disparos' AND column_name IN ('tentativas','ultimo_erro','erro_mensagem','email_remetente','atualizado_em','enviado_em') ORDER BY column_name;

SELECT '=== TESTE QUERY DO WORKER ===' as teste;
SELECT 
  h.id, 
  h.email_destinatario, 
  h.tentativas as h_tentativas, -- FIX: h.tentativas agora existe
  t.email_remetente as t_email_remetente, -- FIX: t.email_remetente agora existe
  t.nome_exibicao,
  t.nome_remetente
FROM email_historico_disparos h
JOIN email_templates t ON h.template_id = t.id
LIMIT 1;

\echo '✅ FIX FINAL APLICADO - Worker pronto para usar t.email_remetente e h.tentativas'*/
