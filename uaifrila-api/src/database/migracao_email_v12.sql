-- 1. TABELA DE STATUS DOS DISPAROS (Segregação de Estados)
CREATE TABLE IF NOT EXISTS email_status (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(20) NOT NULL UNIQUE,
    descricao VARCHAR(50) NOT NULL
);

-- RECONSTRUÇÃO DOS ESTADOS OBRIGATÓRIOS DO FLUXO COM SUPORTE A EXPIRADO
INSERT INTO email_status (chave, descricao) VALUES 
('EM_ESPERA', 'Aguardando processamento do disparador'),
('ENVIADO', 'E-mail transmitido com o código de validação'),
('VALIDADO', 'Código digitado com sucesso pelo usuário final'),
('EXPIRADO', 'Token invalidado por estouro de tempo limite')
ON CONFLICT (chave) DO UPDATE SET descricao = EXCLUDED.descricao;

-- 2. INJEÇÃO DA VARIÁVEL ADMINISTRATIVA DE EXPIRAÇÃO
-- Nota: A tabela 'variaveis_sistema' deve possuir a restrição UNIQUE ou PRIMARY KEY na coluna 'chave'
CREATE TABLE IF NOT EXISTS variaveis_sistema (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(50) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    descricao TEXT,
    atualizado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO variaveis_sistema (chave, valor, descricao, updated_at)
VALUES ('EMAIL_EXPIRACAO_MINUTOS', '5', 'Tempo de validade estrito do token de ativação por e-mail', NOW())
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- 3. TABELA DE CONFIGURAÇÃO E TEMPLATES DE MENSAGENS
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    chave_uso VARCHAR(30) NOT NULL UNIQUE,
    email_remetente VARCHAR(150) NOT NULL,
    nome_exibicao VARCHAR(100) NOT NULL,
    titulo_assunto VARCHAR(200) NOT NULL,
    conteudo_corpo TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO email_templates (chave_uso, email_remetente, nome_exibicao, titulo_assunto, conteudo_corpo) VALUES
('CONFIRMACAO_CADASTRO', 'nao-responda@uaifrila.com.br', 'UAI FRILA - Cadastro', 'Ative sua conta UAI FRILA', 'Olá {{NOME}}, seu código de ativação de cadastro é: {{CODIGO}}'),
('2FA_LOGIN', 'seguranca@uaifrila.com.br', 'UAI FRILA - Segurança', 'Código de Acesso 2FA', 'Seu token de autenticação de dois fatores é: {{CODIGO}}')
ON CONFLICT (chave_uso) DO UPDATE SET conteudo_corpo = EXCLUDED.conteudo_corpo;

-- 4. TABELA DE FILA DE ENVIOS E HISTÓRICO DE AUDITORIA
CREATE TABLE IF NOT EXISTS email_historico_disparos (
    id SERIAL PRIMARY KEY,
    template_id INT NOT NULL,
    usuario_id INT,
    email_destinatario VARCHAR(150) NOT NULL,
    titulo_final VARCHAR(200) NOT NULL,
    conteudo_final TEXT NOT NULL,
    codigo_verificacao VARCHAR(6) NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    expira_em TIMESTAMP NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    erro_mensagem TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_disparo_template FOREIGN KEY (template_id) REFERENCES email_templates(id),
    CONSTRAINT fk_disparo_status FOREIGN KEY (status_id) REFERENCES email_status(id)
);
