-- 05 - Tipos de Usuário e Termos - CORRIGIDO: ordem de execução segura

CREATE TABLE IF NOT EXISTS tipos_usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO tipos_usuario (nome) VALUES ('SUPER_ADMIN'), ('FREELA'), ('CONTRATANTE')
ON CONFLICT (nome) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuario_perfis (
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_id INT REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, tipo_id)
);

-- Vincula admin ao perfil SUPER_ADMIN (id 1)
INSERT INTO usuario_perfis (usuario_id, tipo_id)
SELECT u.id, t.id FROM usuarios u, tipos_usuario t WHERE u.whatsapp = '34999900000' AND t.nome = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Limpa termos antigos e reinsere com IDs relacionais corretos
TRUNCATE TABLE itens_termo_aceite, termos_aceite CASCADE;

INSERT INTO termos_aceite (id, versao, tipo_usuario_id, ativo) VALUES 
(1, 1, 2, TRUE),
(2, 1, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('termos_aceite_id_seq', 2, true);

INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem, ativo_no_termo) VALUES 
(1, 'Autônomo: Declaro que sou autônomo, sem vínculo CLT, sem exclusividade, sem horário fixo. UAI FRILA é apenas marketplace intermediador. (Art. 442-B da CLT)', 1, TRUE),
(1, 'LGPD: Autorizo a verificação cadastral de CPF, RG e Selfie. Os arquivos de imagem serão destruídos permanentemente após a validação.', 2, TRUE),
(1, 'MEI: Estou ciente de que o limite máximo de faturamento mensal para usuários sem MEI é de R$ 1.500,00.', 3, TRUE),
(2, 'Intermediação Corporativa: O UAI FRILA atua sob intermediação com CNAE 74.90-1-04, não se configurando como empregador.', 1, TRUE),
(2, 'Cancelamento e Penalidades: O contratante deve efetuar a quitação via Pix 1h antes do serviço. Cancelamentos fora do prazo retêm multa de R$ 40,00.', 2, TRUE)
ON CONFLICT DO NOTHING;
