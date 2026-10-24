-- DML - Carga Inicial de Dados
-- DDL - Estrutura de Termos Versionados UAI FRILA
CREATE TABLE termos_aceite (
    id SERIAL PRIMARY KEY,
    versao INT NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL, -- 'FREELA' ou 'CONTRATANTE'
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_termo_aceite (
    id SERIAL PRIMARY KEY,
    termo_id INT REFERENCES termos_aceite(id) ON DELETE CASCADE,
    texto_item TEXT NOT NULL,
    ordem INT NOT NULL,
    ativo_no_termo BOOLEAN DEFAULT TRUE
);

-- Insere a Carga Inicial da versão 1 com os textos oficiais blindados
INSERT INTO termos_aceite (versao, tipo_usuario, ativo) VALUES (1, 'FREELA', TRUE);
/*
INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem) VALUES 
(1, 'Declaro que sou autônomo, sem vínculo CLT, sem exclusividade, sem horário fixo. UAI FRILA é apenas marketplace. (Art. 442-B CLT)', 1),
(1, 'Autorizo verificação CPF/RG/selfie e exclusão das fotos após validação, mantendo apenas selo verificado no banco.', 2),
(1, 'Estou ciente do teto limite operacional de faturamento de R$ 1.500,00 por mês no aplicativo para usuários sem MEI ativo.', 3);
*/

INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem, ativo_no_termo) VALUES 
(1, 'Autônomo: Declaro que sou autônomo, sem vínculo CLT, sem exclusividade, sem horário fixo. UAI FRILA é apenas marketplace intermediador. (Art. 442-B da CLT)', 1, TRUE),
(1, 'LGPD: Autorizo a verificação cadastral de CPF, RG e Selfie. Os arquivos de imagem serão destruídos permanentemente após a validação vacinal pela moderação, mantendo apenas o selo verificado.', 2, TRUE),
(1, 'MEI: Estou ciente de que o limite máximo de faturamento mensal para usuários sem cadastro de MEI ativo na plataforma é de R$ 1.500,00. Acima disso é obrigatória a abertura de MEI.', 3, TRUE),
(1, 'Intermediação Corporativa: O UAI FRILA atua sob intermediação com CNAE 74.90-1-04, não se configurando como empregador. Os valores ficam retidos em escrow seguro EFI Bank até a confirmação.', 4, TRUE),
(1, 'Cancelamento e Penalidades: O contratante deve efetuar a quitação via Pix 1h antes do serviço. Cancelamentos fora do prazo retêm multa de R$ 40,00 destinada ao profissional lesado.', 5, TRUE),
(1, 'Código de Responsabilidades: Pontualidade é mandatória em Uberlândia. Chegue 10 minutos antes. 3 atrasos sem aviso geram pausa de 7 dias; no-show gera pausa de 15 dias na plataforma.', 6, TRUE);