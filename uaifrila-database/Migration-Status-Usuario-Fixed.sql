-- MIGRATION SEM PRECISAR SER DONO DA TABELA USUARIOS
-- Rode com usuario postgres ou dono, se não puder, o código cria via fallback

-- 1. Criar status_usuario se não existir
CREATE TABLE IF NOT EXISTS status_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor_hex VARCHAR(20),
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO status_usuario (chave, nome_exibicao, descricao, cor_hex, ordem) VALUES
('AGUARDANDO_VALIDACAO', 'Aguardando Validação', 'Usuário cadastrado mas ainda não validou e-mail', '#FFC700', 1),
('ATIVO', 'Ativo', 'Usuário validado e ativo no sistema', '#00C851', 2),
('INATIVO', 'Inativo', 'Usuário desativado temporariamente', '#9E9E9E', 3),
('BLOQUEADO', 'Bloqueado', 'Usuário bloqueado por violação de regras', '#E53935', 4),
('SUSPENSO', 'Suspenso', 'Usuário suspenso temporariamente', '#FF6D00', 5)
ON CONFLICT (chave) DO NOTHING;

-- 2. Tentar adicionar coluna (precisa ser dono - se falhar, o código usa fallback sem FK)
-- Se você NÃO é dono da tabela usuarios, peça ao DBA para rodar:
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_usuario_id INT REFERENCES status_usuario(id);

-- Alternativa sem FK (funciona mesmo sem ser dono, se tiver permissão de ALTER):
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_usuario_id INT;

-- 3. Verificação
SELECT * FROM status_usuario ORDER BY ordem;