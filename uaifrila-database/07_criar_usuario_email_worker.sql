-- 🗄️ ORDEM DE EXECUÇÃO: 07
-- DESCRIÇÃO: Criação do Usuário Dedicado e Permissões Estritas para o email-worker

-- 1. CRIAÇÃO DO USUÁRIO ISOLADO (Substitua 'SenhaSecretaTrabalhador123' por uma forte no .env)
CREATE USER email_worker_user WITH PASSWORD 'SenhaSecretaTrabalhador123';

-- 2. PERMISSÃO DE CONEXÃO NO BANCO DE DADOS
GRANT CONNECT ON DATABASE uai_frila TO email_worker_user;
GRANT USAGE ON SCHEMA public TO email_worker_user;

-- 3. PERMISSÕES DE LEITURA (SELECT) NAS TABELAS AUXILIARES E DE AMBIENTE
GRANT SELECT ON TABLE email_status TO email_worker_user;
GRANT SELECT ON TABLE email_templates TO email_worker_user;
GRANT SELECT ON TABLE variaveis_ambiente TO email_worker_user;

-- 4. PERMISSÕES COMPLETAS NA TABELA DE HISTÓRICO DE DISPAROS (SELECT, UPDATE)
-- O worker precisa buscar dados e atualizar os status/mensagens de erro
GRANT SELECT, UPDATE ON TABLE email_historico_disparos TO email_worker_user;

-- 5. SE HOUVER AUT INCRIMENTO (SERIAL/SEQUENCE) NA TABELA DE DISPAROS, LIBERA O USO
-- Caso o worker precise reinserir algo futuramente
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO email_worker_user;
