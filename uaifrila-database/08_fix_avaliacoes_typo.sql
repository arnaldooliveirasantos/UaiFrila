-- 08 - Correção crítica: typo avalisdo_id -> avaliado_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='avaliacoes' AND column_name='avalisdo_id') THEN
        ALTER TABLE avaliacoes RENAME COLUMN avalisdo_id TO avaliado_id;
    END IF;
END
$$;

-- Adiciona coluna email se não existir (necessária para AuthController)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
