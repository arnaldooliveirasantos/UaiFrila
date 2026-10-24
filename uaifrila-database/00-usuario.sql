-- 00 - Criação do usuário de aplicação
-- Executar como superusuário postgres
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uai_frila_app') THEN
        CREATE ROLE uai_frila_app WITH LOGIN PASSWORD 'UaiFrila&2026!';
    ELSE
        ALTER ROLE uai_frila_app WITH PASSWORD 'UaiFrila&2026!';
    END IF;
END
$$;
ALTER ROLE uai_frila_app CREATEDB;
-- Cria banco se não existir
SELECT 'CREATE DATABASE uai_frila OWNER uai_frila_app' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'uai_frila')\gexec
GRANT ALL PRIVILEGES ON DATABASE uai_frila TO uai_frila_app;
