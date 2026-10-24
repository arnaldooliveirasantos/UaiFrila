-- 1. Criação da Tabela Forte de Tipos de Usuário
CREATE TABLE tipos_usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE -- 'SUPER_ADMIN', 'FREELA', 'CONTRATANTE'
);

-- 2. Inserção dos Perfis de Escopo do Ecossistema
INSERT INTO tipos_usuario (nome) VALUES ('SUPER_ADMIN'), ('FREELA'), ('CONTRATANTE');

-- 3. Criação da Tabela Pivô de Vínculos Múltiplos (Modo Duplex Ativo)
CREATE TABLE usuario_perfis (
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_id INT REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, tipo_id)
);

-- 4. Migração e Ajuste do Usuário Super Admin padrão do sistema
INSERT INTO usuario_perfis (usuario_id, tipo_id) VALUES (1, 1);

-- 5. Limpeza de colunas legadas obsoletas da tabela usuarios
ALTER TABLE usuarios DROP COLUMN IF EXISTS is_freela;
ALTER TABLE usuarios DROP COLUMN IF EXISTS is_contratante;
ALTER TABLE usuarios DROP COLUMN IF EXISTS is_admin;


ALTER TABLE termos_aceite DROP COLUMN IF EXISTS tipo_usuario;

-- 2. Adiciona a chave estrangeira vinculada à tabela forte de perfis
ALTER TABLE termos_aceite ADD COLUMN tipo_usuario_id INT REFERENCES tipos_usuario(id) ON DELETE CASCADE;

-- 3. Limpa registros desalinhados antigos para evitar duplicidade de chaves
TRUNCATE TABLE itens_termo_aceite CASCADE;
TRUNCATE TABLE termos_aceite CASCADE;

-- 4. Insere os Termos de Aceite Versionados indexados por ID Relacional (1 = ADMIN, 2 = FREELA, 3 = CONTRATANTE)
INSERT INTO termos_aceite (id, versao, tipo_usuario_id, ativo) VALUES 
(1, 1, 2, TRUE), -- Termo indexado para Prestadores (FREELA)
(2, 1, 3, TRUE); -- Termo indexado para Estabelecimentos (CONTRATANTE)

-- 5. Inserção das Cláusulas Oficiais Blindadas v12 nas Sub-Tabelas de Itens
INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem, ativo_no_termo) VALUES 
(1, 'Autônomo: Declaro que sou autônomo, sem vínculo CLT, sem exclusividade, sem horário fixo. UAI FRILA é apenas marketplace intermediador. (Art. 442-B da CLT)', 1, TRUE),
(1, 'LGPD: Autorizo a verificação cadastral de CPF, RG e Selfie. Os arquivos de imagem serão destruídos permanentemente após a validação vacinal pela moderação, mantendo apenas o selo verificado.', 2, TRUE),
(1, 'MEI: Estou ciente de que o limite máximo de faturamento mensal para usuários sem cadastro de MEI ativo na plataforma é de R$ 1.500,00. Acima disso é obrigatória a abertura de MEI.', 3, TRUE),
(2, 'Intermediação Corporativa: O UAI FRILA atua sob intermediação com CNAE 74.90-1-04, não se configurando como empregador. Os valores ficam retidos em escrow seguro EFI Bank até a confirmação.', 1, TRUE),
(2, 'Cancelamento e Penalidades: O contratante deve efetuar a quitação via Pix 1h antes do serviço. Cancelamentos fora do prazo retêm multa de R$ 40,00 destinada ao profissional lesado.', 2, TRUE);