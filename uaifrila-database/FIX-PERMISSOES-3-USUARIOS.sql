-- =====================================================================
-- FIX DEFINITIVO 42501 para UAI FRILA
-- Usuários da aplicação: uaifrila_user, uai_frila_app, email_worker_user
-- Erro: permissão negada para tabela usuarios / esquema public
-- Rode como SUPERUSER postgres
-- =====================================================================

-- COMO RODAR:
-- psql -U postgres -d uaifrila -f FIX_PERMISSOES_3_USUARIOS.sql
-- OU dentro do psql:
-- \i FIX_PERMISSOES_3_USUARIOS.sql

-- 1. LIBERA SCHEMA PUBLIC PARA TODOS (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- 2. GRANT PARA CADA USUARIO DA APLICAÇÃO

-- === uaifrila_user (API principal) ===
DO $$ BEGIN
  EXECUTE 'GRANT ALL ON SCHEMA public TO uaifrila_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uaifrila_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uaifrila_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO uaifrila_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uaifrila_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uaifrila_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO uaifrila_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO uaifrila_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO uaifrila_user';
  RAISE NOTICE '✅ Permissões OK para uaifrila_user';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ uaifrila_user: %', SQLERRM;
END $$;

-- === uai_frila_app (APP secundário) ===
DO $$ BEGIN
  EXECUTE 'GRANT ALL ON SCHEMA public TO uai_frila_app';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uai_frila_app';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uai_frila_app';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO uai_frila_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uai_frila_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uai_frila_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO uai_frila_app';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO uai_frila_app';
  RAISE NOTICE '✅ Permissões OK para uai_frila_app';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ uai_frila_app: %', SQLERRM;
END $$;

-- === email_worker_user (Worker de e-mail) ===
DO $$ BEGIN
  EXECUTE 'GRANT ALL ON SCHEMA public TO email_worker_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO email_worker_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO email_worker_user';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO email_worker_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO email_worker_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO email_worker_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO email_worker_user';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO email_worker_user';
  RAISE NOTICE '✅ Permissões OK para email_worker_user';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ email_worker_user: %', SQLERRM;
END $$;

-- 3. GARANTE QUE POSTGRES CONTINUA DONO (melhor prática)
ALTER SCHEMA public OWNER TO postgres;

-- Opcional: tornar postgres dono de todas as tabelas existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO postgres';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
  FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
    BEGIN
      EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO postgres';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- 4. VERIFICAÇÃO
/*\echo '=== VERIFICANDO PERMISSÕES ==='
SELECT 
  grantee as usuario,
  table_name as tabela,
  string_agg(privilege_type, ', ') as permissoes
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('uaifrila_user', 'uai_frila_app', 'email_worker_user')
AND table_name = 'usuarios'
GROUP BY grantee, table_name
ORDER BY grantee;

SELECT '=== TABELAS EXISTENTES ===' as info;
SELECT tablename as tabela, tableowner as dono FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 5. TESTE RÁPIDO (como cada usuário)
-- Se der erro aqui, o usuário não existe no banco - crie com CREATE ROLE

\echo '=== FIM DO FIX ==='
\echo 'Agora reinicie sua API: npm run dev'
*/