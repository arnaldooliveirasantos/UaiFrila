-- 04 - Termos v12 - Corrigido para usar estrutura nova direto
CREATE TABLE IF NOT EXISTS termos_aceite (
    id SERIAL PRIMARY KEY,
    versao INT NOT NULL,
    tipo_usuario_id INT REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens_termo_aceite (
    id SERIAL PRIMARY KEY,
    termo_id INT REFERENCES termos_aceite(id) ON DELETE CASCADE,
    texto_item TEXT NOT NULL,
    ordem INT NOT NULL,
    ativo_no_termo BOOLEAN DEFAULT TRUE
);
