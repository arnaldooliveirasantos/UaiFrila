-- =====================================================================
-- UAI FRILA - DATABASE COMPLETO FINAL - TODAS AS TABELAS
-- PostgreSQL 14+
-- Data: 2026-10-24 - VERSÃO FINAL CORRIGIDA
-- =====================================================================
-- Inclui:
-- 1. cidades (existente com campos ativa)
-- 2. status_usuario
-- 3. usuarios
-- 4. enderecos_usuario (só 1 ativo + bloqueio trampo)
-- 5. tipos_usuario, funcoes
-- 6. vagas, candidaturas, trampos, transacoes, avaliacoes
-- 7. termos_aceite, itens_termo_aceite, termos_aceite_usuario
-- 8. chat_mensagens, variaveis_ambiente, email
-- 9. Funções e Views corrigidas
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpeza
DROP VIEW IF EXISTS vw_enderecos_completo CASCADE;
DROP VIEW IF EXISTS vw_usuarios_com_endereco_ativo CASCADE;
DROP VIEW IF EXISTS vw_mural_vagas CASCADE;
DROP VIEW IF EXISTS cidades_ativas CASCADE;
DROP FUNCTION IF EXISTS fn_verificar_trampo_em_andamento(INT) CASCADE;
DROP FUNCTION IF EXISTS fn_garantir_um_endereco_ativo() CASCADE;
DROP FUNCTION IF EXISTS fn_sync_endereco_ativo_para_usuarios() CASCADE;

-- =====================================================================
-- 1. CIDADES - TABELA JÁ EXISTENTE COM CAMPOS DE CIDADE ATIVA
-- =====================================================================
CREATE TABLE IF NOT EXISTS cidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  estado VARCHAR(2) DEFAULT 'MG' NOT NULL,
  codigo_ibge VARCHAR(10),
  ativa BOOLEAN DEFAULT true NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  raio_km INT DEFAULT 20 NOT NULL,
  populacao INT,
  regiao VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(nome, estado)
);

ALTER TABLE cidades ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS raio_km INT DEFAULT 20;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS codigo_ibge VARCHAR(10);
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS populacao INT;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS regiao VARCHAR(50);
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cidades_nome ON cidades(nome);
CREATE INDEX IF NOT EXISTS idx_cidades_ativa ON cidades(ativa) WHERE ativa = true;

INSERT INTO cidades (nome, estado, ativa, lat, lng, raio_km, regiao, codigo_ibge) VALUES
('Uberlândia', 'MG', true, -18.9186, -48.2772, 25, 'Triângulo Mineiro', '3170206'),
('Uberaba', 'MG', true, -19.7476, -47.9381, 20, 'Triângulo Mineiro', '3170107'),
('Araguari', 'MG', true, -18.6455, -48.1873, 15, 'Triângulo Mineiro', '3103504'),
('Ituiutaba', 'MG', false, -18.9689, -49.4656, 15, 'Triângulo Mineiro', '3134202'),
('Patrocínio', 'MG', false, -18.9443, -46.9936, 15, 'Triângulo Mineiro', '3144607')
ON CONFLICT (nome, estado) DO UPDATE SET ativa = EXCLUDED.ativa, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

-- =====================================================================
-- 2. TIPOS_USUARIO e FUNÇÕES
-- =====================================================================
CREATE TABLE IF NOT EXISTS tipos_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(30) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(50) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);
INSERT INTO tipos_usuario (chave, nome_exibicao, descricao) VALUES
('FREELA', 'Freela', 'Prestador de serviço autônomo'),
('CONTRATANTE', 'Contratante', 'Contrata freelas'),
('DUAL', 'Freela e Contratante', 'Atua como os dois'),
('ADMIN', 'Administrador', 'Admin do sistema')
ON CONFLICT (chave) DO NOTHING;

CREATE TABLE IF NOT EXISTS funcoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL,
  categoria VARCHAR(50),
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);
INSERT INTO funcoes (nome, categoria) VALUES
('Garçom', 'Alimentação'), ('Bartender', 'Alimentação'), ('Cozinheiro', 'Alimentação'),
('Auxiliar de Cozinha', 'Alimentação'), ('Recepcionista', 'Atendimento'),
('Segurança', 'Segurança'), ('Limpeza', 'Limpeza'), ('Outros', 'Outros')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================================
-- 3. STATUS_USUARIO
-- =====================================================================
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
('ATIVO', 'Ativo', 'Usuário validado e ativo', '#00C851', 2),
('INATIVO', 'Inativo', 'Desativado', '#9E9E9E', 3),
('BLOQUEADO', 'Bloqueado', 'Bloqueado por violação', '#E53935', 4),
('SUSPENSO', 'Suspenso', 'Suspenso temporariamente', '#FF6D00', 5)
ON CONFLICT (chave) DO NOTHING;

-- =====================================================================
-- 4. USUARIOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  nome_fantasia VARCHAR(150),
  is_freela BOOLEAN DEFAULT false,
  is_contratante BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  status_usuario_id INT REFERENCES status_usuario(id) DEFAULT 1,
  tipo_usuario_id INT REFERENCES tipos_usuario(id),
  bairro VARCHAR(100),
  endereco_completo TEXT,
  endereco_lat DOUBLE PRECISION,
  endereco_lng DOUBLE PRECISION,
  cidade_id INT REFERENCES cidades(id),
  cidade_nome VARCHAR(100),
  funcao_principal VARCHAR(50) DEFAULT 'Garçom',
  valor_hora_base NUMERIC(10,2) DEFAULT 20,
  bio TEXT,
  tem_mei BOOLEAN DEFAULT false,
  como_chega VARCHAR(20),
  ajuda_uber NUMERIC(10,2),
  avaliacao_media NUMERIC(3,2) DEFAULT 5.0,
  total_avaliacoes INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade_id INT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade_nome VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_lat DOUBLE PRECISION;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_lng DOUBLE PRECISION;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario_id INT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avaliacao_media NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS total_avaliacoes INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cidade ON usuarios(cidade_id);

-- =====================================================================
-- 5. ENDERECOS_USUARIO - SÓ UM ATIVO + BLOQUEIO SE TRAMPO EM ANDAMENTO
-- =====================================================================
CREATE TABLE IF NOT EXISTS enderecos_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endereco_completo TEXT NOT NULL,
  bairro VARCHAR(150),
  cidade_id INT REFERENCES cidades(id),
  cidade_nome VARCHAR(100) NOT NULL,
  estado VARCHAR(2) DEFAULT 'MG',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_ativo BOOLEAN DEFAULT true NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enderecos_usuario_id ON enderecos_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cidade ON enderecos_usuario(cidade_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_ativo ON enderecos_usuario(usuario_id, is_ativo) WHERE is_ativo = true;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_endereco_ativo_por_usuario ON enderecos_usuario(usuario_id) WHERE is_ativo = true;

CREATE OR REPLACE FUNCTION fn_garantir_um_endereco_ativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_ativo = true THEN
    UPDATE enderecos_usuario SET is_ativo = false, atualizado_em = NOW()
    WHERE usuario_id = NEW.usuario_id AND id != NEW.id AND is_ativo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_garantir_um_ativo ON enderecos_usuario;
CREATE TRIGGER trg_garantir_um_ativo
  BEFORE INSERT OR UPDATE OF is_ativo ON enderecos_usuario
  FOR EACH ROW WHEN (NEW.is_ativo = true)
  EXECUTE FUNCTION fn_garantir_um_endereco_ativo();

CREATE OR REPLACE FUNCTION fn_sync_endereco_ativo_para_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_ativo = true THEN
    UPDATE usuarios SET
      endereco_completo = NEW.endereco_completo,
      bairro = NEW.bairro,
      cidade_id = NEW.cidade_id,
      cidade_nome = NEW.cidade_nome,
      endereco_lat = NEW.lat,
      endereco_lng = NEW.lng,
      atualizado_em = NOW()
    WHERE id = NEW.usuario_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_endereco_usuarios ON enderecos_usuario;
CREATE TRIGGER trg_sync_endereco_usuarios
  AFTER INSERT OR UPDATE ON enderecos_usuario
  FOR EACH ROW WHEN (NEW.is_ativo = true)
  EXECUTE FUNCTION fn_sync_endereco_ativo_para_usuarios();

-- =====================================================================
-- 6. VAGAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS vagas (
  id SERIAL PRIMARY KEY,
  contratante_id INT REFERENCES usuarios(id) NOT NULL,
  titulo VARCHAR(200),
  funcao VARCHAR(50) NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP NOT NULL,
  horas_estimadas INT DEFAULT 8,
  valor_hora NUMERIC(10,2) DEFAULT 20,
  valor_hora_limpo NUMERIC(10,2),
  ajuda_custo_transporte NUMERIC(10,2) DEFAULT 0,
  endereco_completo TEXT NOT NULL,
  endereco_id INT REFERENCES enderecos_usuario(id),
  cidade_id INT REFERENCES cidades(id),
  bairro VARCHAR(100),
  cidade_nome VARCHAR(100),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status VARCHAR(30) DEFAULT 'PENDENTE',
  freela_aceito_id INT REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vagas ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS endereco_id INT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS cidade_id INT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS valor_hora NUMERIC(10,2);
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS freela_aceito_id INT;

CREATE INDEX IF NOT EXISTS idx_vagas_contratante ON vagas(contratante_id);
CREATE INDEX IF NOT EXISTS idx_vagas_status ON vagas(status);
CREATE INDEX IF NOT EXISTS idx_vagas_cidade ON vagas(cidade_id);
CREATE INDEX IF NOT EXISTS idx_vagas_data ON vagas(data_hora);

-- =====================================================================
-- 7. CANDIDATURAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS candidaturas (
  id SERIAL PRIMARY KEY,
  vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE NOT NULL,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  freela_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'PENDENTE',
  mensagem TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(vaga_id, usuario_id),
  UNIQUE(vaga_id, freela_id)
);

ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS usuario_id INT;
ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS freela_id INT;
ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS mensagem TEXT;

CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga ON candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_freela ON candidaturas(freela_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON candidaturas(status);

-- =====================================================================
-- 8. TRAMPOS (histórico de execução)
-- =====================================================================
CREATE TABLE IF NOT EXISTS trampos (
  id SERIAL PRIMARY KEY,
  vaga_id INT REFERENCES vagas(id) NOT NULL,
  freela_id INT REFERENCES usuarios(id) NOT NULL,
  contratante_id INT REFERENCES usuarios(id) NOT NULL,
  status VARCHAR(30) DEFAULT 'EM_ANDAMENTO',
  endereco_id INT REFERENCES enderecos_usuario(id),
  checkin_em TIMESTAMP,
  checkout_em TIMESTAMP,
  valor_total NUMERIC(10,2),
  horas_trabalhadas NUMERIC(5,2),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trampos_freela ON trampos(freela_id);
CREATE INDEX IF NOT EXISTS idx_trampos_contratante ON trampos(contratante_id);
CREATE INDEX IF NOT EXISTS idx_trampos_status ON trampos(status);

-- =====================================================================
-- 9. TRANSACOES E AVALIACOES
-- =====================================================================
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  vaga_id INT REFERENCES vagas(id),
  trampo_id INT REFERENCES trampos(id),
  tipo VARCHAR(30) NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  taxa_plataforma NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2),
  status VARCHAR(30) DEFAULT 'PENDENTE',
  metodo_pagamento VARCHAR(30),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  vaga_id INT REFERENCES vagas(id) NOT NULL,
  trampo_id INT REFERENCES trampos(id),
  avaliador_id INT REFERENCES usuarios(id) NOT NULL,
  avaliado_id INT REFERENCES usuarios(id) NOT NULL,
  nota INT CHECK (nota >= 1 AND nota <= 5) NOT NULL,
  comentario TEXT,
  tipo VARCHAR(20),
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(vaga_id, avaliador_id, avaliado_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliado ON avaliacoes(avaliado_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_vaga ON avaliacoes(vaga_id);

-- =====================================================================
-- 10. TERMOS - TERMOS_ACEITE E ITENS
-- =====================================================================
CREATE TABLE IF NOT EXISTS tipos_termo_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(30) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL
);
INSERT INTO tipos_termo_usuario (chave, nome_exibicao) VALUES
('FREELA', 'Termos Freela'), ('CONTRATANTE', 'Termos Contratante'), ('GERAL', 'Termos Gerais')
ON CONFLICT (chave) DO NOTHING;

CREATE TABLE IF NOT EXISTS termos_aceite (
  id SERIAL PRIMARY KEY,
  versao INT NOT NULL,
  tipo_usuario_id INT REFERENCES tipos_termo_usuario(id) NOT NULL,
  titulo VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  criado_por INT REFERENCES usuarios(id),
  UNIQUE(versao, tipo_usuario_id)
);

CREATE TABLE IF NOT EXISTS itens_termo_aceite (
  id SERIAL PRIMARY KEY,
  termo_id INT REFERENCES termos_aceite(id) ON DELETE CASCADE NOT NULL,
  texto_item TEXT NOT NULL,
  ordem INT NOT NULL,
  ativo_no_termo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS termos_aceite_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  termo_id INT REFERENCES termos_aceite(id) NOT NULL,
  item_id INT REFERENCES itens_termo_aceite(id),
  versao INT NOT NULL,
  aceito_em TIMESTAMP DEFAULT NOW(),
  ip_aceite VARCHAR(45),
  UNIQUE(usuario_id, termo_id, item_id)
);

-- Seed termos padrão
INSERT INTO termos_aceite (versao, tipo_usuario_id, titulo, ativo) VALUES
(1, 1, 'Termos Freela v1', true), (1, 2, 'Termos Contratante v1', true)
ON CONFLICT (versao, tipo_usuario_id) DO NOTHING;

INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem) 
SELECT t.id, item.texto, item.ordem FROM termos_aceite t CROSS JOIN (VALUES
('Autônomo Art 442-B CLT - Declaro ser autônomo nos termos do art. 442-B da CLT', 1),
('LGPD - Autorizo uso de dados conforme LGPD', 2),
('MEI R$1500 - Ciente do limite MEI R$1500 por contratante', 3),
('Cancelamento R$40 - Ciente da taxa de cancelamento R$40', 4),
('Intermediação - Ciente da taxa de intermediação da plataforma', 5)
) AS item(texto, ordem)
WHERE t.versao = 1
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 11. CHAT
-- =====================================================================
CREATE TABLE IF NOT EXISTS chat_mensagens (
  id SERIAL PRIMARY KEY,
  vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE NOT NULL,
  remetente_id INT REFERENCES usuarios(id) NOT NULL,
  destinatario_id INT REFERENCES usuarios(id),
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'TEXTO',
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_vaga ON chat_mensagens(vaga_id);
CREATE INDEX IF NOT EXISTS idx_chat_remetente ON chat_mensagens(remetente_id);

-- =====================================================================
-- 12. EMAIL E VARIÁVEIS
-- =====================================================================
CREATE TABLE IF NOT EXISTS email_status (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL
);
INSERT INTO email_status (chave, nome) VALUES
('EM_ESPERA','Em espera'), ('ENVIADO','Enviado'), ('VALIDADO','Validado'), ('EXPIRADO','Expirado')
ON CONFLICT (chave) DO NOTHING;

CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  chave_uso VARCHAR(100) UNIQUE NOT NULL,
  titulo_assunto VARCHAR(200) NOT NULL,
  conteudo_corpo TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);
INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo) VALUES
('CONFIRMACAO_CADASTRO', 'Confirme seu cadastro - UAI FRILA', 'Olá {{NOME}}, seu código é {{CODIGO}}. E-mail: {{EMAIL}}'),
('2FA_LOGIN', 'Código de login - UAI FRILA', 'Seu código de login é {{CODIGO}}')
ON CONFLICT (chave_uso) DO NOTHING;

CREATE TABLE IF NOT EXISTS email_historico_disparos (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES email_templates(id),
  usuario_id INT REFERENCES usuarios(id),
  email_destinatario VARCHAR(150) NOT NULL,
  titulo_final VARCHAR(200),
  conteudo_final TEXT,
  codigo_verificacao VARCHAR(10),
  status_id INT REFERENCES email_status(id),
  dados_cadastro JSONB,
  expira_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variaveis_ambiente (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor VARCHAR(200) NOT NULL,
  descricao TEXT
);
INSERT INTO variaveis_ambiente (chave, valor, descricao) VALUES
('EMAIL_EXPIRACAO_MINUTOS','5','Tempo expiração código e-mail'),
('TAXA_PLATAFORMA_PERCENTUAL','15','Taxa da plataforma %'),
('TAXA_CANCELAMENTO','40','Taxa cancelamento R$'),
('VALOR_MINIMO_HORA','15','Valor mínimo hora'),
('RAIO_MAXIMO_CIDADE_KM','30','Raio máximo cidade km')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================================
-- 13. FUNÇÃO CORRIGIDA - VERIFICAR TRAMPO EM ANDAMENTO
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_verificar_trampo_em_andamento(p_usuario_id INT)
RETURNS TABLE (tem_trampo BOOLEAN, tabela TEXT, id_registro INT, status_registro VARCHAR) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_id INT;
  v_status VARCHAR;
BEGIN
  SELECT v.id, v.status::VARCHAR INTO v_id, v_status FROM vagas v WHERE v.contratante_id = p_usuario_id AND v.status IN ('EM_ANDAMENTO','ATIVO','CONFIRMADO') LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT true, 'vagas'::TEXT, v_id, v_status; RETURN; END IF;

  SELECT c.id, c.status::VARCHAR INTO v_id, v_status FROM candidaturas c WHERE (c.usuario_id = p_usuario_id OR c.freela_id = p_usuario_id) AND c.status IN ('EM_ANDAMENTO','CONFIRMADO','ACEITO') LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT true, 'candidaturas'::TEXT, v_id, v_status; RETURN; END IF;

  SELECT t.id, t.status::VARCHAR INTO v_id, v_status FROM trampos t WHERE (t.freela_id = p_usuario_id OR t.contratante_id = p_usuario_id) AND t.status IN ('EM_ANDAMENTO','ACEITO','CONFIRMADO') LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT true, 'trampos'::TEXT, v_id, v_status; RETURN; END IF;

  SELECT tr.id, tr.status::VARCHAR INTO v_id, v_status FROM transacoes tr WHERE tr.usuario_id = p_usuario_id AND tr.status = 'EM_ANDAMENTO' LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT true, 'transacoes'::TEXT, v_id, v_status; RETURN; END IF;

  RETURN QUERY SELECT false, ''::TEXT, 0::INT, ''::VARCHAR;
END;
$$;

-- =====================================================================
-- 14. VIEWS CORRIGIDAS - SEM DUPLICIDADE ESTADO
-- =====================================================================
CREATE OR REPLACE VIEW vw_usuarios_com_endereco_ativo AS
SELECT 
  u.*,
  eu.id as endereco_ativo_id,
  eu.endereco_completo as endereco_ativo_completo,
  eu.bairro as endereco_ativo_bairro,
  eu.lat as endereco_ativo_lat,
  eu.lng as endereco_ativo_lng,
  eu.cidade_nome as endereco_ativo_cidade,
  c.nome as cidade_real,
  c.ativa as cidade_ativa,
  c.raio_km as cidade_raio_km
FROM usuarios u
LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
LEFT JOIN cidades c ON c.id = eu.cidade_id;

CREATE OR REPLACE VIEW vw_enderecos_completo AS
SELECT 
  eu.id,
  eu.usuario_id,
  eu.endereco_completo,
  eu.bairro,
  eu.cidade_id,
  eu.cidade_nome,
  eu.estado as endereco_estado,
  eu.lat,
  eu.lng,
  eu.is_ativo,
  eu.criado_em,
  eu.atualizado_em,
  u.nome_completo,
  u.email,
  u.is_freela,
  u.is_contratante,
  c.nome as cidade_nome_real,
  c.estado as cidade_estado,
  c.ativa as cidade_ativa,
  c.lat as cidade_lat,
  c.lng as cidade_lng,
  c.raio_km as cidade_raio_km
FROM enderecos_usuario eu
JOIN usuarios u ON u.id = eu.usuario_id
LEFT JOIN cidades c ON c.id = eu.cidade_id;

CREATE OR REPLACE VIEW vw_mural_vagas AS
SELECT 
  v.*,
  u.nome_completo as contratante_nome,
  u.email as contratante_email,
  c.nome as cidade_nome_real,
  c.ativa as cidade_ativa,
  eu.endereco_completo as endereco_referencia,
  (SELECT COUNT(*) FROM candidaturas cand WHERE cand.vaga_id = v.id) as total_candidaturas
FROM vagas v
JOIN usuarios u ON u.id = v.contratante_id
LEFT JOIN cidades c ON c.id = v.cidade_id
LEFT JOIN enderecos_usuario eu ON eu.id = v.endereco_id
WHERE v.status = 'PENDENTE';

-- View compatibilidade cidades_ativas
DO $$ 
BEGIN 
  IF to_regclass('cidades_ativas') IS NULL THEN 
    CREATE VIEW cidades_ativas AS SELECT * FROM cidades WHERE ativa = true; 
  END IF; 
END $$;

-- =====================================================================
-- 15. MIGRAÇÃO DE DADOS ANTIGOS
-- =====================================================================
DO $$
BEGIN
  IF to_regclass('cidades_ativas') IS NOT NULL AND to_regclass('cidades_ativas')::text != 'cidades' THEN
    INSERT INTO cidades (nome, estado, ativa, lat, lng, raio_km)
    SELECT nome, estado, ativa, lat, lng, COALESCE(raio_km,20) FROM cidades_ativas
    ON CONFLICT (nome, estado) DO NOTHING;
  END IF;
END $$;

INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, lat, lng, is_ativo)
SELECT id, endereco_completo, bairro, cidade_id, COALESCE(cidade_nome,'Uberlândia'), endereco_lat, endereco_lng, true
FROM usuarios WHERE endereco_completo IS NOT NULL
ON CONFLICT DO NOTHING;

-- =====================================================================
-- FIM - DATABASE COMPLETO FINAL
-- =====================================================================