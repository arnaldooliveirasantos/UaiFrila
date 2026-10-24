-- MIGRATION v13.5 - REMOVER WHATSAPP - USAR APENAS EMAIL
-- Execute este arquivo se já tem banco com whatsapp

-- Remove coluna whatsapp se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='whatsapp') THEN
    ALTER TABLE usuarios DROP COLUMN whatsapp;
    RAISE NOTICE 'Coluna whatsapp removida de usuarios';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='telefone') THEN
    ALTER TABLE usuarios DROP COLUMN telefone;
    RAISE NOTICE 'Coluna telefone removida de usuarios';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='whatsapp_numero') THEN
    ALTER TABLE usuarios DROP COLUMN whatsapp_numero;
    RAISE NOTICE 'Coluna whatsapp_numero removida';
  END IF;
END $$;

-- Remove índices de whatsapp
DROP INDEX IF EXISTS idx_usuarios_whatsapp;
DROP INDEX IF EXISTS idx_usuarios_telefone;
 
-- Remove índices de whatsapp
ALTER TABLE usuarios  add email VARCHAR(150) UNIQUE NOT null;
-- Atualiza comentários
COMMENT ON TABLE usuarios IS 'Usuarios Uai Frila v13.5 - contato apenas por e-mail, sem whatsapp';
COMMENT ON COLUMN usuarios.email IS 'Único canal de contato - código de verificação enviado por e-mail';

-- Verifica
SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' ORDER BY ordinal_position;