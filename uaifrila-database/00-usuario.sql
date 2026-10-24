-- 1. Criação do Usuário/Role de Aplicação (Executar como superusuário 'postgres')
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uai_frila_app') THEN
        CREATE ROLE uai_frila_app WITH LOGIN PASSWORD 'UaiFrila&2026!';
    ELSE
        ALTER ROLE uai_frila_app WITH PASSWORD 'UaiFrila&2026!';
    END IF;
END
$$;

-- 2. Concede privilégio de criação de tabelas e modificação do banco para o usuário
ALTER ROLE uai_frila_app CREATEDB;

-- 3. Concede todas as permissões administrativas dentro do escopo do banco uai_frila
GRANT ALL PRIVILEGES ON DATABASE uai_frila TO uai_frila_app;
