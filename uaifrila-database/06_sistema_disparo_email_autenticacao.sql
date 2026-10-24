-- 🗄️ ORDEM DE EXECUÇÃO: 06
-- DESCRIÇÃO: Correção da Coluna de Auditoria na Inserção da Variável de Expiração de E-mail

-- 1. ADIÇÃO DE CAMPOS DE AUDITORIA NA TABELA EXISTENTE
ALTER TABLE variaveis_ambiente ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE variaveis_ambiente ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- 2. REESTRUTURAÇÃO DA TABELA DE HISTÓRICO (Rastreabilidade por Chave)
CREATE TABLE IF NOT EXISTS historico_variaveis_ambiente (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(50) NOT NULL,
    valor_antigo VARCHAR(255),
    valor_novo VARCHAR(255),
    acao VARCHAR(10) NOT NULL,
    alterado_em TIMESTAMP DEFAULT NOW()
);

-- 3. FUNÇÃO PL/pgSQL
CREATE OR REPLACE FUNCTION trg_auditoria_variaveis_ambiente()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO historico_variaveis_ambiente (chave, valor_antigo, valor_novo, acao, alterado_em)
        VALUES (NEW.chave, NULL, NEW.valor, 'INSERT', NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.valor IS DISTINCT FROM NEW.valor) THEN
            NEW.atualizado_em = NOW();
            INSERT INTO historico_variaveis_ambiente (chave, valor_antigo, valor_novo, acao, alterado_em)
            VALUES (OLD.chave, OLD.valor, NEW.valor, 'UPDATE', NOW());
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO historico_variaveis_ambiente (chave, valor_antigo, valor_novo, acao, alterado_em)
        VALUES (OLD.chave, OLD.valor, NULL, 'DELETE', NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. REASSOCIAÇÃO DA TRIGGER
DROP TRIGGER IF EXISTS tgr_variaveis_ambiente_auditoria ON variaveis_ambiente;
CREATE TRIGGER tgr_variaveis_ambiente_auditoria
BEFORE INSERT OR UPDATE OR DELETE ON variaveis_ambiente
FOR EACH ROW EXECUTE FUNCTION trg_auditoria_variaveis_ambiente();

-- 5. TABELA DE STATUS DOS DISPAROS
CREATE TABLE IF NOT EXISTS email_status (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(20) NOT NULL UNIQUE,
    descricao VARCHAR(50) NOT NULL
);

INSERT INTO email_status (chave, descricao) VALUES 
('EM_ESPERA', 'Aguardando processamento do disparador'),
('ENVIADO', 'E-mail transmitido com o código de validação'),
('VALIDADO', 'Código digitado com sucesso pelo usuário final'),
('EXPIRADO', 'Token invalidado por estouro de tempo limite')
ON CONFLICT (chave) DO UPDATE SET descricao = EXCLUDED.descricao;

-- 6. INJEÇÃO DA VARIÁVEL DE EXPIRAÇÃO - 🟢 CORRIGIDO: atualizado_em no lugar de updated_at
INSERT INTO variaveis_ambiente (chave, valor, descricao, criado_em, atualizado_em)
VALUES ('EMAIL_EXPIRACAO_MINUTOS', '5', 'Tempo de validade estrito do token de ativação por e-mail', NOW(), NOW())
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = NOW();

-- 7. TABELA DE CONFIGURAÇÃO E TEMPLATES DE MENSAGENS
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
('CONFIRMACAO_CADASTRO', 'nao-responda@uaifrila.com.br', 'UAI FRILA - Cadastro', 'Ative sua conta UAI FRILA', 'Olá {{NOME}}', seu código de ativação de cadastro é: {' || '{CODIGO}}'),
('2FA_LOGIN', 'seguranca@uaifrila.com.br', 'UAI FRILA - Segurança', 'Código de Acesso 2FA', 'Seu token de autenticação de dois fatores é: {' || '{CODIGO}}')
ON CONFLICT (chave_uso) DO UPDATE SET conteudo_corpo = EXCLUDED.conteudo_corpo;

-- 8. TABELA DE FILA DE ENVIOS E HISTÓRICO DE AUDITORIA
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
