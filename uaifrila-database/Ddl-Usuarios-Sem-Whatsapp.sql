-- DDL usuarios v13.5 - REMOVIDO WHATSAPP - APENAS EMAIL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255),
  cnpj VARCHAR(18),
  nome_fantasia VARCHAR(150),
  is_freela BOOLEAN DEFAULT FALSE,
  is_contratante BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  funcao_principal VARCHAR(50),
  valor_hora_base NUMERIC(10,2) DEFAULT 20,
  bio TEXT,
  bairro VARCHAR(100),
  como_chega VARCHAR(20),
  ajuda_custo_uber NUMERIC(10,2) DEFAULT 10,
  tem_mei BOOLEAN DEFAULT FALSE,
  foto_url TEXT,
  status VARCHAR(20) DEFAULT 'ATIVO',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices apenas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_bairro ON usuarios(bairro);
CREATE INDEX IF NOT EXISTS idx_usuarios_funcao ON usuarios(funcao_principal);