-- 00 - Criação do usuário de aplicação
-- Executar como superusuário postgres
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uai_frila_app') THEN
        CREATE ROLE uai_frila_app WITH LOGIN PASSWORD 'UaiFrila&2026!';
    ELSE
        ALTER ROLE uai_frila_app WITH PASSWORD 'UaiFrila&2026!';
    END IF;
    
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'email_worker_user') THEN
        CREATE ROLE email_worker_user WITH LOGIN PASSWORD 'SenhaSecretaTrabalhador123';
    ELSE
        ALTER ROLE email_worker_user WITH PASSWORD 'SenhaSecretaTrabalhador123';
    END IF;
    
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uaifrila_user') THEN
        CREATE ROLE uaifrila_user WITH LOGIN PASSWORD 'UaiFrila&2026!';
    ELSE
        ALTER ROLE uaifrila_user WITH PASSWORD 'UaiFrila&2026!';
    END IF;
END
$$;
ALTER ROLE uai_frila_app CREATEDB;
-- Cria banco se não existir
SELECT 'CREATE DATABASE uai_frila OWNER uai_frila_app' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'uai_frila')\gexec
GRANT ALL PRIVILEGES ON DATABASE uai_frila TO uaifrila_user;
GRANT ALL PRIVILEGES ON DATABASE uai_frila TO uai_frila_app;
GRANT ALL PRIVILEGES ON DATABASE uai_frila TO email_worker_user;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;
ALTER SCHEMA public OWNER TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO PUBLIC;
GRANT ALL ON SCHEMA public TO uaifrila_user;
GRANT ALL ON SCHEMA public TO uai_frila_app;
GRANT ALL ON SCHEMA public TO email_worker_user;

uaifrila_user
 uai_frila_app
 email_worker_user