-- 1. CRIAR TABELA status_usuario
CREATE TABLE IF NOT EXISTS status_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor_hex VARCHAR(20),
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 2. INSERIR STATUS PADRÕES
INSERT INTO status_usuario (chave, nome_exibicao, descricao, cor_hex, ordem) VALUES
('AGUARDANDO_VALIDACAO', 'Aguardando Validação', 'Usuário cadastrado mas ainda não validou e-mail', '#FFC700', 1),
('ATIVO', 'Ativo', 'Usuário validado e ativo no sistema', '#00C851', 2),
('INATIVO', 'Inativo', 'Usuário desativado temporariamente', '#9E9E9E', 3),
('BLOQUEADO', 'Bloqueado', 'Usuário bloqueado por violação de regras', '#E53935', 4),
('SUSPENSO', 'Suspenso', 'Usuário suspenso temporariamente', '#FF6D00', 5)
ON CONFLICT (chave) DO NOTHING;

-- 3. ADICIONAR COLUNA status_usuario_id NA TABELA USUARIOS
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_usuario_id INT REFERENCES status_usuario(id);

-- 4. MIGRAR DADOS ANTIGOS (status VARCHAR -> status_usuario_id)
UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'AGUARDANDO_VALIDACAO') WHERE LOWER(TRIM(status)) = 'aguardando_validacao' AND status_usuario_id IS NULL;
UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'ATIVO') WHERE (LOWER(TRIM(status)) = 'ativo' OR status IS NULL OR status = '') AND status_usuario_id IS NULL;
UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'INATIVO') WHERE LOWER(TRIM(status)) = 'inativo' AND status_usuario_id IS NULL;
UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'BLOQUEADO') WHERE LOWER(TRIM(status)) = 'bloqueado' AND status_usuario_id IS NULL;

-- Garante que todos tenham status
UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'ATIVO') WHERE status_usuario_id IS NULL;

-- 5. VERIFICAÇÃO
SELECT 'status_usuario' as tabela, COUNT(*) as total FROM status_usuario
UNION ALL
SELECT 'usuarios por status', COUNT(*) FROM usuarios GROUP BY status_usuario_id;

SELECT u.id, u.email, u.nome_completo, su.chave as status_chave, su.nome_exibicao 
FROM usuarios u 
LEFT JOIN status_usuario su ON su.id = u.status_usuario_id 
ORDER BY u.id DESC LIMIT 10;