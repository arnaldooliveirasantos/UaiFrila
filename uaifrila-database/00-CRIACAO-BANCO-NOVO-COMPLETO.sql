-- =====================================================================
-- UAI FRILA - CRIAÇÃO COMPLETA DO BANCO - 00_CRIACAO_BANCO_NOVO_COMPLETO.sql
-- PostgreSQL 14+
-- Data: 2026-10-27
-- SÓ CREATE E INSERT + GRANTS - SEM ALTER TABLE
-- Inclui todas as tabelas atuais + grants + usuário super admin
-- =====================================================================
-- COMO USAR:
-- psql -U postgres -c "CREATE DATABASE uaifrila;"
-- psql -U postgres -d uaifrila -f 00_CRIACAO_BANCO_NOVO_COMPLETO.sql
-- =====================================================================

CREATE EXTENSION pgcrypto;
CREATE EXTENSION "uuid-ossp";

-- =====================================================================
-- 1. PAISES, ESTADOS, CIDADES, BAIRROS, EXPANSAO
-- =====================================================================
CREATE TABLE paises (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  sigla VARCHAR(3) UNIQUE NOT NULL,
  codigo_ibge INT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estados (
  id SERIAL PRIMARY KEY,
  pais_id INT NOT NULL REFERENCES paises(id),
  nome VARCHAR(100) NOT NULL,
  sigla VARCHAR(2) NOT NULL,
  codigo_ibge INT,
  regiao VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(sigla, pais_id)
);

create table cidades (
  id SERIAL primary key,
nome VARCHAR(100) not null,
estado VARCHAR(2) default 'MG' not null,
codigo_ibge VARCHAR(10),
ativa BOOLEAN default true not null,
lat DOUBLE precision,
lng DOUBLE precision,
raio_km INT default 20 not null,
populacao INT,
regiao VARCHAR(50),
pais_id INT,
estado_id INT,
cep_prefixo VARCHAR(10),
status_expansao VARCHAR(20) default 'ATIVA',
demanda_score INT default 0,
vagas_abertas INT default 0,
freelas_ativos INT default 0,
criado_em TIMESTAMP default NOW(),
atualizado_em TIMESTAMP default NOW(),
unique(nome, estado)
);

CREATE INDEX idx_cidades_nome ON cidades(nome);
CREATE INDEX idx_cidades_ativa ON cidades(ativa);

CREATE TABLE bairros (
  id SERIAL PRIMARY KEY,
  cidade_id INT NOT NULL REFERENCES cidades(id),
  nome VARCHAR(150) NOT NULL,
  zona VARCHAR(50),
  demanda INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(nome, cidade_id)
);

CREATE TABLE expansao_cidades (
  id SERIAL PRIMARY KEY,
  cidade_nome VARCHAR(100) NOT NULL,
  estado_sigla VARCHAR(2) NOT NULL,
  pais_sigla VARCHAR(3) DEFAULT 'BRA',
  populacao INT,
  demanda_solicitacoes INT DEFAULT 0,
  demanda_vagas INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'SOLICITADA',
  prioridade INT DEFAULT 0,
  solicitado_por INT,
  analisado_por INT,
  motivo TEXT,
  data_solicitacao TIMESTAMP DEFAULT NOW(),
  data_analise TIMESTAMP,
  data_ativacao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 2. TIPOS_USUARIO - FONTE ÚNICA DE PERMISSÃO
-- =====================================================================
CREATE TABLE tipos_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(30) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(50) NOT NULL,
  descricao TEXT,
  nivel_permissao INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funcoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) UNIQUE NOT NULL,
  categoria VARCHAR(50),
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE status_usuario (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor_hex VARCHAR(20),
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 3. USUARIOS
-- =====================================================================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  nome_fantasia VARCHAR(150),
  status_usuario_id INT REFERENCES status_usuario(id) DEFAULT 1,
  tipo_usuario_id INT REFERENCES tipos_usuario(id) NOT NULL DEFAULT 1,
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
  permissoes JSONB DEFAULT '[]'::jsonb,
  role VARCHAR(30) DEFAULT 'FREELA',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario_id);

-- =====================================================================
-- 4. ENDERECOS_USUARIO
-- =====================================================================
CREATE TABLE enderecos_usuario (
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

CREATE UNIQUE INDEX uniq_endereco_ativo_por_usuario ON enderecos_usuario(usuario_id) WHERE is_ativo = true;

-- =====================================================================
-- 5. VAGAS, CANDIDATURAS, TRAMPOS, TRANSACOES, AVALIACOES
-- =====================================================================
CREATE TABLE vagas (
  id SERIAL PRIMARY KEY,
  contratante_id INT NOT NULL REFERENCES usuarios(id),
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  funcao VARCHAR(50),
  valor_hora NUMERIC(10,2) NOT NULL,
  valor_servico NUMERIC(10,2) ,
  valor_transporte NUMERIC(10,2) ,
  total_freela NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'PENDENTE',
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);


-- =====================================================================
--  5.1  ENDERECOS_VAGA
-- =====================================================================
CREATE TABLE enderecos_Vaga (
  id SERIAL PRIMARY KEY,
  vaga_id INT NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
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


CREATE TABLE candidaturas (
  id SERIAL PRIMARY KEY,
  vaga_id INT NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  freela_id INT REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'PENDENTE',
  mensagem TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(vaga_id, usuario_id)
);

CREATE TABLE trampos (
  id SERIAL PRIMARY KEY,
  vaga_id INT NOT NULL REFERENCES vagas(id),
  freela_id INT NOT NULL REFERENCES usuarios(id),
  contratante_id INT NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'ACEITO',
  codigo_inicio VARCHAR(10),
  codigo_fim VARCHAR(10),
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  vaga_id INT REFERENCES vagas(id),
  trampo_id INT REFERENCES trampos(id),
  freela_id INT NOT NULL REFERENCES usuarios(id),
  contratante_id INT NOT NULL REFERENCES usuarios(id),
  cidade_id INT REFERENCES cidades(id),
  cidade_nome VARCHAR(100),
  valor_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxa_percentual DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  taxa_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  ajuda_custo DECIMAL(10,2) DEFAULT 0,
  valor_total_contratante DECIMAL(10,2) NOT NULL,
  valor_liquido_freela DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
  data_inicio TIMESTAMP,
  data_fim_prevista TIMESTAMP,
  data_fim_real TIMESTAMP,
  data_pagamento TIMESTAMP,
  data_liberacao TIMESTAMP,
  expira_em TIMESTAMP,
  metodo_pagamento VARCHAR(50) DEFAULT 'PIX',
  comprovante_url TEXT,
  observacoes TEXT,
  motivo_cancelamento TEXT,
  usuario_id INT REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transacoes_freela ON transacoes(freela_id);
CREATE INDEX idx_transacoes_status ON transacoes(status);

CREATE TABLE avaliacoes (
  id SERIAL PRIMARY KEY,
  trampo_id INT REFERENCES trampos(id),
  avaliador_id INT REFERENCES usuarios(id),
  avaliado_id INT REFERENCES usuarios(id),
  nota INT CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 6. EMAIL - COM enviado_em, ultima_tentativa
-- =====================================================================
CREATE TABLE email_status (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(30) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL
);

CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  chave_uso VARCHAR(100) UNIQUE NOT NULL,
  titulo_assunto VARCHAR(200) NOT NULL,
  conteudo_corpo TEXT NOT NULL,
  email_remetente VARCHAR(150) DEFAULT 'noreply@uaifrila.com.br',
  nome_remetente VARCHAR(100) DEFAULT 'UAI FRILA',
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_historico_disparos (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES email_templates(id),
  usuario_id INT REFERENCES usuarios(id),
  email_destinatario VARCHAR(150) NOT NULL,
  titulo_final VARCHAR(200),
  conteudo_final TEXT,
  codigo_verificacao VARCHAR(10),
  status_id INT REFERENCES email_status(id),
  dados_cadastro JSONB,
  email_remetente VARCHAR(150),
  tentativas INT DEFAULT 0,
  ultimo_erro TEXT,
  expira_em TIMESTAMP,
  enviado_em TIMESTAMP,
  ultima_tentativa TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 7. VARIAVEIS_SISTEMA UNIFICADA
-- =====================================================================
CREATE TABLE variaveis_sistema (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor VARCHAR(500) NOT NULL,
  valor_numerico DECIMAL(12,2),
  tipo VARCHAR(20) DEFAULT 'string',
  descricao TEXT,
  categoria VARCHAR(50) DEFAULT 'geral',
  editavel BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 8. FUNÇÕES E VIEWS
-- =====================================================================
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

CREATE TRIGGER trg_garantir_um_ativo
  BEFORE INSERT OR UPDATE OF is_ativo ON enderecos_usuario
  FOR EACH ROW WHEN (NEW.is_ativo = true)
  EXECUTE FUNCTION fn_garantir_um_endereco_ativo();

CREATE OR REPLACE FUNCTION fn_gerar_codigo_transacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('transacoes_id_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codigo_transacao
  BEFORE INSERT ON transacoes
  FOR EACH ROW EXECUTE FUNCTION fn_gerar_codigo_transacao();

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
  SELECT tr.id, tr.status::VARCHAR INTO v_id, v_status FROM transacoes tr WHERE (tr.freela_id = p_usuario_id OR tr.contratante_id = p_usuario_id) AND tr.status = 'EM_ANDAMENTO' LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT true, 'transacoes'::TEXT, v_id, v_status; RETURN; END IF;
  RETURN QUERY SELECT false, ''::TEXT, 0::INT, ''::VARCHAR;
END;
$$;

CREATE VIEW vw_usuarios_com_endereco_ativo AS
SELECT u.*, tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao,
  eu.id as endereco_ativo_id, eu.endereco_completo as endereco_ativo_completo,
  eu.bairro as endereco_ativo_bairro, eu.lat as endereco_ativo_lat, eu.lng as endereco_ativo_lng,
  eu.cidade_nome as endereco_ativo_cidade, c.nome as cidade_real, c.ativa as cidade_ativa, c.raio_km as cidade_raio_km
FROM usuarios u
LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
LEFT JOIN cidades c ON c.id = eu.cidade_id;

CREATE VIEW vw_enderecos_completo AS
SELECT eu.id, eu.usuario_id, eu.endereco_completo, eu.bairro, eu.cidade_id, eu.cidade_nome,
  eu.estado as endereco_estado, eu.lat, eu.lng, eu.is_ativo, eu.criado_em, eu.atualizado_em,
  u.nome_completo, u.email, tu.chave as tipo_chave, tu.nivel_permissao,
  c.nome as cidade_nome_real, c.estado as cidade_estado, c.ativa as cidade_ativa,
  c.lat as cidade_lat, c.lng as cidade_lng, c.raio_km as cidade_raio_km
FROM enderecos_usuario eu
JOIN usuarios u ON u.id = eu.usuario_id
LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
LEFT JOIN cidades c ON c.id = eu.cidade_id;

CREATE VIEW vw_mural_vagas AS
SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email,
  c.nome as cidade_nome_real, c.ativa as cidade_ativa, ev.endereco_completo as endereco_referencia,
  (SELECT COUNT(*) FROM candidaturas cand WHERE cand.vaga_id = v.id) as total_candidaturas
FROM vagas v
JOIN usuarios u ON u.id = v.contratante_id
LEFT JOIN Enderecos_vaga ev ON v.id = ev.vaga_id
LEFT JOIN cidades c ON c.id = ev.cidade_id
WHERE v.status = 'PENDENTE';

CREATE VIEW cidades_ativas AS SELECT * FROM cidades WHERE ativa = true;

CREATE VIEW vw_transacoes_periodo AS
SELECT t.id, t.codigo, t.status, t.cidade_nome,
  u1.nome_completo as freela_nome, u2.nome_completo as contratante_nome,
  t.valor_base, t.taxa_valor, t.valor_total_contratante, t.valor_liquido_freela,
  t.data_pagamento, t.criado_em,
  DATE_TRUNC('day', t.criado_em) as dia, DATE_TRUNC('month', t.criado_em) as mes
FROM transacoes t
LEFT JOIN usuarios u1 ON u1.id = t.freela_id
LEFT JOIN usuarios u2 ON u2.id = t.contratante_id;

-- =====================================================================
-- INSERTS - TODOS NECESSÁRIOS PARA APP FUNCIONAR NORMAL
-- =====================================================================

INSERT INTO paises (nome, sigla, codigo_ibge) VALUES
('Brasil', 'BRA', 76);

INSERT INTO estados (pais_id, nome, sigla, codigo_ibge, regiao) VALUES
(1, 'Minas Gerais', 'MG', 31, 'Sudeste'),
(1, 'São Paulo', 'SP', 35, 'Sudeste'),
(1, 'Goiás', 'GO', 52, 'Centro-Oeste'),
(1, 'Distrito Federal', 'DF', 53, 'Centro-Oeste'),
(1, 'Rio de Janeiro', 'RJ', 33, 'Sudeste'),
(1, 'Bahia', 'BA', 29, 'Nordeste');

INSERT INTO cidades (nome, estado, ativa, lat, lng, raio_km, regiao, codigo_ibge, populacao, status_expansao, demanda_score) VALUES
('Uberlândia', 'MG', true, -18.9186, -48.2772, 25, 'Triângulo Mineiro', '3170206', 713232, 'ATIVA', 100),
('Uberaba', 'MG', true, -19.7476, -47.9381, 20, 'Triângulo Mineiro', '3170107', 337836, 'ATIVA', 80),
('Araguari', 'MG', true, -18.6455, -48.1873, 15, 'Triângulo Mineiro', '3103504', 117825, 'ATIVA', 60),
('Ituiutaba', 'MG', false, -18.9689, -49.4656, 15, 'Triângulo Mineiro', '3134202', 105818, 'INATIVA', 20),
('Patrocínio', 'MG', false, -18.9443, -46.9936, 15, 'Triângulo Mineiro', '3144607', 91995, 'INATIVA', 15);

INSERT INTO bairros (cidade_id, nome, zona, demanda) VALUES
(1, 'Centro', 'Central', 45),
(1, 'Santa Mônica', 'Leste', 38),
(1, 'Granja Marileusa', 'Sul', 25),
(1, 'Patrimônio', 'Central', 22),
(1, 'Laranjeiras', 'Sul', 20),
(1, 'Karaíba', 'Sul', 15),
(1, 'Morada da Colina', 'Sul', 12),
(1, 'Jardim Karaíba', 'Sul', 18),
(1, 'Tibery', 'Leste', 30),
(1, 'Martins', 'Central', 35),
(1, 'Umuarama', 'Leste', 28),
(1, 'Jardim Brasília', 'Norte', 20);

INSERT INTO expansao_cidades (cidade_nome, estado_sigla, populacao, demanda_solicitacoes, demanda_vagas, status, prioridade, motivo) VALUES
('Araguari', 'MG', 117825, 23, 15, 'SOLICITADA', 2, 'Cidade vizinha com alta demanda de garçons'),
('Uberaba', 'MG', 337836, 45, 32, 'EM_ANALISE', 3, 'Polo regional com muitos eventos'),
('Patrocínio', 'MG', 91995, 12, 8, 'SOLICITADA', 1, 'Demanda crescente de freelas'),
('Ituiutaba', 'MG', 105818, 18, 10, 'SOLICITADA', 1, 'Eventos agropecuários'),
('São Paulo', 'SP', 12396372, 156, 98, 'APROVADA', 3, 'Capital com demanda nacional'),
('Goiânia', 'GO', 1554879, 89, 56, 'EM_ANALISE', 2, 'Expansão centro-oeste');

INSERT INTO tipos_usuario (chave, nome_exibicao, descricao, nivel_permissao) VALUES
('FREELA', 'Freela', 'Prestador de serviço autônomo - pode ver mural e se candidatar', 0),
('CONTRATANTE', 'Contratante', 'Contrata freelas - pode publicar vagas', 10),
('DUAL', 'Freela e Contratante', 'Atua como os dois - publica e trampa', 20),
('FINANCEIRO', 'Financeiro', 'Acesso a transações, escrow, pagamentos e relatórios financeiros', 50),
('SUPORTE', 'Suporte', 'Atendimento e suporte a usuários', 60),
('MODERADOR', 'Moderador', 'Modera vagas, denúncias e usuários', 80),
('ADMIN', 'Administrador', 'Admin do sistema - acesso a cidades, expansão, variáveis', 90),
('SUPER_ADMIN', 'Super Admin', 'Acesso total - gerencia permissões, tipos, tudo', 100);

INSERT INTO funcoes (nome, categoria) VALUES
('Garçom', 'Alimentação'),
('Bartender', 'Alimentação'),
('Cozinheiro', 'Alimentação'),
('Auxiliar de Cozinha', 'Alimentação'),
('Recepcionista', 'Atendimento'),
('Segurança', 'Segurança'),
('Limpeza', 'Limpeza'),
('Outros', 'Outros');

INSERT INTO status_usuario (chave, nome_exibicao, descricao, cor_hex, ordem) VALUES
('AGUARDANDO_VALIDACAO', 'Aguardando Validação', 'Usuário cadastrado mas ainda não validou e-mail', '#FFC700', 1),
('ATIVO', 'Ativo', 'Usuário validado e ativo', '#00C851', 2),
('INATIVO', 'Inativo', 'Desativado', '#9E9E9E', 3),
('BLOQUEADO', 'Bloqueado', 'Bloqueado por violação', '#E53935', 4),
('SUSPENSO', 'Suspenso', 'Suspenso temporariamente', '#FF6D00', 5);

INSERT INTO email_status (chave, nome) VALUES
('EM_ESPERA','Em espera'),
('ENVIADO','Enviado'),
('VALIDADO','Validado'),
('EXPIRADO','Expirado');

INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente) VALUES
('CONFIRMACAO_CADASTRO', 'Confirme seu cadastro - Código {{CODIGO}} - UAI FRILA', 
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: sans-serif; background: #FFFFFF; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; border: 4px solid #000; background: #FFFFFF;">
    <!-- HEADER com grid mostarda -->
    <div style="background: #000; color: #fff; padding: 20px; text-align: center; background-image: linear-gradient(to right, rgba(204,153,0,0.22) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(204,153,0,0.22) 1.2px, transparent 1.2px); background-size: 36px 36px;">
      <h1 style="font-weight: 900; font-size: 28px; margin: 0; letter-spacing: -1px;">UAI FRILA</h1>
      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 2px;">Trampos diários em Uberlândia</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="font-size: 14px;">Olá, <b>{{NOME}}</b>!</p>
      <p style="font-size: 13px;">Seu cadastro no Uai Frila está quase pronto. Confirme seu e-mail:</p>
      
      <!-- CÓDIGO GRANDE -->
      <div style="background: #FFC700; border: 4px solid #000; padding: 20px; text-align: center; margin: 20px 0; box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);">
        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; margin: 0;">Seu código de 6 dígitos</p>
        <p style="font-size: 38px; font-weight: 900; letter-spacing: 8px; margin: 10px 0;">{{CODIGO}}</p>
        <p style="font-size: 10px; margin: 0;">Válido por {{TEMPO_EXPIRACAO}} minutos • Não compartilhe</p>
      </div>

      <!-- BOTÃO VALIDAR AUTOMÁTICO -->
      <div style="margin: 24px 0;">
        <a href="{{LINK_VALIDAR}}" style="display: block; background: #0066FF; color: #fff; text-align: center; padding: 18px; font-weight: 900; text-transform: uppercase; text-decoration: none; border: 3px solid #000; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); font-size: 13px;">
          ✅ CLIQUE AQUI PARA VALIDAR AUTOMATICAMENTE
        </a>
        <p style="font-size: 10px; color: #666; text-align: center; margin-top: 10px;">Se o botão não funcionar, copie o código e cole na tela de validação<br>Link direto: {{LINK_VALIDAR}}</p>
      </div>

      <!-- DICA MOBILE - ANTI REFRESH -->
      <div style="background: #f3f3f3; border: 2px solid #000; padding: 14px; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;"><b>📱 Está no celular?</b> Deixe a aba do Uai Frila aberta! Abra este e-mail em outra aba ou app. Seu progresso fica salvo mesmo se atualizar a página. O timer continua contando.</p>
      </div>

      <hr style="border: none; border-top: 3px dashed #000; margin: 24px 0;">

      <!-- CANCELAR -->
      <div style="text-align: center; background: #fff; border: 2px solid #E53935; padding: 16px;">
        <p style="font-size: 11px; font-weight: 900; margin: 0 0 8px 0; text-transform: uppercase;">Não foi você que fez este cadastro?</p>
        <a href="{{LINK_CANCELAR}}" style="color: #E53935; font-size: 12px; font-weight: 900; text-transform: uppercase;">🚫 Não sou eu - Cancelar e bloquear cadastro</a>
        <p style="font-size: 9px; color: #999; margin: 8px 0 0 0;">Se você não solicitou, clique acima e seu e-mail será protegido contra uso indevido.</p>
      </div>

      <p style="font-size: 9px; color: #999; text-align: center; margin-top: 24px;">Uai Frila - Trampos diários • Valor por serviço + transporte • Pix no dia • {{FRONTEND_URL}}</p>
    </div>
  </div>
</body>
</html>',
'noreply@uaifrila.com.br', 'UAI FRILA');

-- 2. LOGIN - Com link mágico anti-refresh
INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente) VALUES
('2FA_LOGIN', 'Seu código de acesso: {{CODIGO}} - UAI FRILA',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: sans-serif; background: #000; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; border: 4px solid #fff; background: #000; color: #fff;">
    <div style="background: #000; color: #fff; padding: 20px; text-align: center; border-bottom: 4px solid #fff; background-image: linear-gradient(to right, rgba(0,102,255,0.22) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(0,102,255,0.22) 1.2px, transparent 1.2px); background-size: 40px 40px;">
      <h1 style="font-weight: 900; font-size: 28px; margin: 0;">UAI FRILA</h1>
      <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Código de acesso</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="font-size: 14px;">Olá, <b>{{NOME}}</b>! Seu código de acesso:</p>
      
      <div style="background: #000; color: #fff; border: 4px solid #fff; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; margin: 0; color: #fff;">Código</p>
        <p style="font-size: 38px; font-weight: 900; letter-spacing: 8px; margin: 10px 0; color: #fff;">{{CODIGO}}</p>
        <p style="font-size: 10px; margin: 0; color: #ccc;">Válido por {{TEMPO_EXPIRACAO}} minutos</p>
      </div>

      <div style="margin: 24px 0;">
        <a href="{{LINK_VALIDAR}}" style="display: block; background: #fff; color: #000; text-align: center; padding: 18px; font-weight: 900; text-transform: uppercase; text-decoration: none; border: 3px solid #fff; font-size: 13px;">
          🔓 CLIQUE PARA ENTRAR AUTOMATICAMENTE
        </a>
        <p style="font-size: 10px; color: #999; text-align: center; margin-top: 10px;">Link direto: {{LINK_VALIDAR}}</p>
      </div>

      <div style="background: #111; border: 2px solid #333; padding: 14px;">
        <p style="font-size: 11px; margin: 0; color: #ccc;"><b style="color: #fff;">📱 No celular:</b> Você pode voltar para a aba do Uai Frila e colar o código. Não precisa decorar, seu login fica salvo se atualizar. Deixe a aba aberta!</p>
      </div>

      <p style="font-size: 9px; color: #666; text-align: center; margin-top: 24px;">Se não foi você, ignore. Código expira em {{TEMPO_EXPIRACAO}} minutos. {{FRONTEND_URL}}</p>
    </div>
  </div>
</body>
</html>',
'noreply@uaifrila.com.br', 'UAI FRILA');

-- 3. RECUPERAÇÃO / REENVIO
INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente) VALUES
('REENVIO_CODIGO', 'Novo código: {{CODIGO}} - UAI FRILA',
'<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #000; padding: 24px;">
  <h1 style="font-weight: 900;">UAI FRILA</h1>
  <p>Olá {{NOME}}, novo código solicitado:</p>
  <div style="background: #FFC700; border: 4px solid #000; padding: 20px; text-align: center; margin: 20px 0;">
    <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px;">{{CODIGO}}</p>
  </div>
  <a href="{{LINK_VALIDAR}}" style="display: block; background: #0066FF; color: #fff; text-align: center; padding: 16px; font-weight: 900; text-decoration: none;">VALIDAR AGORA</a>
  <p style="font-size: 11px; margin-top: 16px;">Se não foi você, clique aqui para cancelar: <a href="{{LINK_CANCELAR}}">Cancelar cadastro</a></p>
</div>',
'noreply@uaifrila.com.br', 'UAI FRILA');

INSERT INTO variaveis_sistema (chave, valor, valor_numerico, tipo, descricao, categoria, editavel) VALUES
('EMAIL_EXPIRACAO_MINUTOS', '5', 5, 'number', 'Tempo expiração código e-mail em minutos', 'email', true),
('TAXA_PLATAFORMA_PERCENTUAL', '10', 10, 'number', 'Taxa da plataforma % - legado', 'financeiro', true),
('TAXA_CANCELAMENTO', '40', 40, 'number', 'Taxa cancelamento R$ - legado', 'financeiro', true),
('VALOR_MINIMO_HORA', '15', 15, 'number', 'Valor mínimo hora', 'financeiro', true),
('RAIO_MAXIMO_CIDADE_KM', '30', 30, 'number', 'Raio máximo cidade km - legado', 'cidade', true),
('PAGAMENTO_ANTECEDENCIA_MINUTOS', '60', 60, 'number', 'Minutos de antecedência para pagamento antes do trampo', 'pagamento', true),
('PAGAMENTO_EXPIRA_AUTO_MINUTOS', '30', 30, 'number', 'Minutos para expirar pagamento não confirmado (início + 30min)', 'pagamento', true),
('TAXA_INTERMEDIACAO_PERCENTUAL', '15', 15, 'number', 'Taxa de intermediação da plataforma em %', 'financeiro', true),
('TAXA_CANCELAMENTO_VALOR', '40', 40, 'number', 'Multa por cancelamento < 4h em R$', 'financeiro', true),
('TAXA_CANCELAMENTO_LIMITE_MINUTOS', '240', 240, 'number', 'Limite em minutos para aplicar multa de cancelamento (4h)', 'financeiro', true),
('FREELA_CANCELAMENTO_LIMITE_MINUTOS', '240', 240, 'number', 'Tempo mínimo antes do trampo que freela pode cancelar sem multa', 'freela', true),
('FREELA_BANIMENTO_POR_NO_SHOW', 'true', 1, 'boolean', 'Se deve banir freela por no-show', 'freela', true),
('FREELA_BANIMENTO_MESES', '3', 3, 'number', 'Meses de banimento por no-show', 'freela', true),
('FREELA_OPORTUNIDADES_MAX', '5', 5, 'number', 'Máximo de candidaturas simultâneas por freela', 'freela', true),
('MEI_LIMITE_MENSAL', '1500', 1500, 'number', 'Limite MEI por contratante por mês em R$', 'financeiro', true),
('ESCROW_LIBERACAO_AUTOMATICA_HORAS', '24', 24, 'number', 'Horas para liberação automática do escrow após finalização', 'pagamento', true),
('CIDADE_RAIO_KM_PADRAO', '20', 20, 'number', 'Raio padrão em KM para validar endereço na cidade', 'cidade', true), 
('VALOR_MINIMO_VAGA', '75', 75.00, 'number', 'Valor minimo que contratante pode solicitar um servico (R$)', 'vagas', true),
('TAXA_PIX_PERCENTUAL', '1', 1.00, 'number', 'Taxa PIX 1% sobre subtotal servico', 'financeiro', true),
('TAXA_CARTAO_PERCENTUAL', '4', 4.00, 'number', 'Taxa Cartao 4% sobre subtotal servico', 'financeiro', true),
('COMISSAO_APLICATIVO', '10', 10.00, 'number', 'Comissao aplicativo 10% sobre subtotal', 'financeiro', true),
('VAGA_ANTECEDENCIA_MINUTOS', '30', 30.00, 'number', 'Antecedencia minima para criar vaga em minutos', 'vagas', true)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  valor_numerico = EXCLUDED.valor_numerico,
  tipo = EXCLUDED.tipo,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  editavel = EXCLUDED.editavel,
  atualizado_em = NOW();
-- SUPER ADMIN OBRIGATÓRIO
INSERT INTO usuarios (
  nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia,
  status_usuario_id, tipo_usuario_id, role, permissoes,
  bairro, endereco_completo, cidade_id, cidade_nome,
  funcao_principal, valor_hora_base, bio
) VALUES (
  'Uai Frila',
  '52998224725',
  'uaifrila@gmail.com',
  'd7c5b0d5d3b0e1f2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
  '12345678000199',
  'UAI FRILA PLATAFORMA',
  2,
  8,
  'SUPER_ADMIN',
  '["dashboard","transacoes","expansao","cidades","variaveis","vagas","candidaturas","usuarios","permissoes","custos","financeiro","admin","moderador","suporte","all"]'::jsonb,
  'Centro',
  'Av. Floriano Peixoto, 1000 - Centro, Uberlândia - MG',
  1,
  'Uberlândia',
  'Super Admin',
  100,
  'Super administrador da plataforma Uai Frila. Acesso total - tipo SUPER_ADMIN nivel 100.'
);

INSERT INTO enderecos_usuario (usuario_id, endereco_completo, bairro, cidade_id, cidade_nome, lat, lng, is_ativo) VALUES
(1, 'Av. Floriano Peixoto, 1000 - Centro, Uberlândia - MG', 'Centro', 1, 'Uberlândia', -18.9186, -48.2772, true);

-- GRANTS - USUARIOS DE BANCO PARA APLICAÇÃO
CREATE ROLE uaifrila_app_dev WITH LOGIN PASSWORD 'UaiFrila@pp2024!';
CREATE ROLE uaifrila_readonly_dev WITH LOGIN PASSWORD 'UaiFrila@ead2024!';
CREATE ROLE uaifrila_worker_dev WITH LOGIN PASSWORD 'UaiFrila@Worker2024!';

GRANT CONNECT ON DATABASE uaifrila TO uaifrila_app_dev;
GRANT USAGE ON SCHEMA public TO uaifrila_app_dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uaifrila_app_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uaifrila_app_dev;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO uaifrila_app_dev;

GRANT CONNECT ON DATABASE uaifrila TO uaifrila_readonly_dev;
GRANT USAGE ON SCHEMA public TO uaifrila_readonly_dev;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO uaifrila_readonly_dev;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO uaifrila_readonly_dev;

GRANT CONNECT ON DATABASE uaifrila TO uaifrila_worker_dev;
GRANT USAGE ON SCHEMA public TO uaifrila_worker_dev;
GRANT SELECT, INSERT, UPDATE ON transacoes TO uaifrila_worker_dev;
GRANT SELECT, INSERT, UPDATE ON email_historico_disparos TO uaifrila_worker_dev;
GRANT SELECT, INSERT, UPDATE ON trampos TO uaifrila_worker_dev;
GRANT SELECT, INSERT, UPDATE ON candidaturas TO uaifrila_worker_dev;
GRANT SELECT ON vagas TO uaifrila_worker_dev;
GRANT SELECT ON usuarios TO uaifrila_worker_dev;
GRANT SELECT ON variaveis_sistema TO uaifrila_worker_dev;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO uaifrila_worker_dev;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO uaifrila_worker_dev;

GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- FIM - SEM ALTER TABLE
