-- DDL - Usuários e Vagas - Cadastro Unificado com marcador
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY, whatsapp VARCHAR(20) UNIQUE NOT NULL, email VARCHAR(150) UNIQUE NOT NULL, senha VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(150), cpf VARCHAR(14) UNIQUE, nome_fantasia VARCHAR(150), cnpj VARCHAR(18) UNIQUE,
  funcao_principal VARCHAR(100), valor_hora_base NUMERIC(10,2), bio TEXT, bairro_id INT REFERENCES bairros(id),
  como_chega VARCHAR(50), custo_transporte NUMERIC(10,2), tem_mei BOOLEAN DEFAULT FALSE, aceitou_termos BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vagas (
  id SERIAL PRIMARY KEY, contratante_id INT REFERENCES usuarios(id) ON DELETE CASCADE, funcao VARCHAR(100) NOT NULL,
  data_hora TIMESTAMP NOT NULL, horas_estimadas INT NOT NULL DEFAULT 8, valor_hora_limpo NUMERIC(10,2) NOT NULL,
  ajuda_custo_transporte NUMERIC(10,2) DEFAULT 0, endereco_completo TEXT NOT NULL, bairro_id INT REFERENCES bairros(id), status VARCHAR(50) DEFAULT 'PENDENTE', criado_em TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS candidaturas (id SERIAL PRIMARY KEY, vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE, freela_id INT REFERENCES usuarios(id) ON DELETE CASCADE, status VARCHAR(50) DEFAULT 'AGUARDANDO', UNIQUE(vaga_id, freela_id), criado_em TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS trampos (id SERIAL PRIMARY KEY, vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE, freela_id INT REFERENCES usuarios(id) ON DELETE CASCADE, codigo_inicio VARCHAR(10) NOT NULL, codigo_fim VARCHAR(10) NOT NULL, ponto_inicio TIMESTAMP, ponto_fim TIMESTAMP, status VARCHAR(50) DEFAULT 'AGUARDANDO_PAGAMENTO', criado_em TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS avaliacoes (id SERIAL PRIMARY KEY, trampo_id INT REFERENCES trampos(id) ON DELETE CASCADE, avaliador_id INT REFERENCES usuarios(id) ON DELETE CASCADE, avaliado_id INT REFERENCES usuarios(id) ON DELETE CASCADE, nota INT CHECK (nota>=1 AND nota<=5), comentario TEXT, tipo VARCHAR(20) NOT NULL, criado_em TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS mensagens_chat (id SERIAL PRIMARY KEY, vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE, remetente_id INT REFERENCES usuarios(id) ON DELETE CASCADE, destinatario_id INT REFERENCES usuarios(id) ON DELETE CASCADE, conteudo TEXT NOT NULL, enviado_em TIMESTAMP DEFAULT NOW());
