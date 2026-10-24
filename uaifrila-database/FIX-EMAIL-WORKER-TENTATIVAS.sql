-- =====================================================================
-- FIX PARA: coluna h.tentativas não existe
-- Worker: uaifrila-email-worker
-- Tabela: email_historico_disparos
-- Rode como postgres superuser
-- =====================================================================

-- psql -U postgres -d uaifrila -f FIX_EMAIL_WORKER_TENTATIVAS.sql

-- 1. Verifica estrutura atual
--\d email_historico_disparos

-- 2. Adiciona colunas que o email worker espera
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS tentativas INT DEFAULT 0 NOT NULL;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS ultima_tentativa TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS erro_envio TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS status_envio VARCHAR(20) DEFAULT 'PENDENTE';
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS tentativas_envio INT DEFAULT 0;

-- Colunas extras que workers costumam usar
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS provider_response TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(200);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS data_envio TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS data_leitura TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS aberto BOOLEAN DEFAULT false;

-- Garante colunas básicas que já deveriam existir
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS template_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS email_destinatario VARCHAR(150);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS titulo_final VARCHAR(200);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS conteudo_final TEXT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS codigo_verificacao VARCHAR(10);
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS status_id INT;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS expira_em TIMESTAMP;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();

-- 3. Cria índices para performance do worker
CREATE INDEX IF NOT EXISTS idx_email_historico_status ON email_historico_disparos(status_id);
CREATE INDEX IF NOT EXISTS idx_email_historico_tentativas ON email_historico_disparos(tentativas);
CREATE INDEX IF NOT EXISTS idx_email_historico_criado ON email_historico_disparos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_email_historico_expira ON email_historico_disparos(expira_em);

-- 4. Permissões para os 3 usuários
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO uaifrila_user;
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO uai_frila_app;
GRANT ALL PRIVILEGES ON TABLE email_historico_disparos TO email_worker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uaifrila_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uai_frila_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO email_worker_user;
/*
-- 5. Verifica
\d email_historico_disparos
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'email_historico_disparos' 
ORDER BY ordinal_position;

-- TESTE: query que o worker faz (deve parar de dar erro)
SELECT h.id, h.email_destinatario, h.tentativas, h.ultimo_erro, h.criado_em
FROM email_historico_disparos h
WHERE h.tentativas < 3
ORDER BY h.criado_em DESC
LIMIT 5;

\echo '✅ FIX APLICADO - Reinicie o email worker'
*/