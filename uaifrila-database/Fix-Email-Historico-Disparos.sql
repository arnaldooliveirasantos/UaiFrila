-- FIX para erro: coluna dados_cadastro não existe
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB;
ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT;
-- Verifica estrutura
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='email_historico_disparos';