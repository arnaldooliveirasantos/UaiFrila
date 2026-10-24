-- Estrutura complementar de Roles e Permissões
CREATE TABLE rbac_roles (id SERIAL PRIMARY KEY, nome VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE rbac_permissoes (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL UNIQUE, chave VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE rbac_role_permissoes (role_id INT REFERENCES rbac_roles(id) ON DELETE CASCADE, permissao_id INT REFERENCES rbac_permissoes(id) ON DELETE CASCADE, PRIMARY KEY(role_id, permissao_id));

-- Inserção das 7 Roles padrão do sistema
INSERT INTO rbac_roles (nome) VALUES ('SUPER_ADMIN'), ('ADMIN_FINANCEIRO'), ('ADMIN_REGIONAL'), ('CONTRATANTE_PREMIUM'), ('CONTRATANTE_PADRAO'), ('FREELA_SUPER'), ('FREELA_PADRAO');

-- Inserção de uma amostra das 26 Permissões do sistema
INSERT INTO rbac_permissoes (nome, chave) VALUES 
('Visualizar Transações Financeiras', 'VER_TRANSACOES'),
('Alterar Variáveis de Ambiente', 'EDITAR_VARIAVEIS'),
('Ativar ou Bloquear Cidades', 'GERENCIAR_CIDADES'),
('Publicar Vagas sem Limites', 'PUBLICAR_VAGAS_ILIMITADO'),
('Aceitar Candidatos em Jobs', 'ACEITAR_CANDIDATOS'),
('Disparar Ponto Digital Real', 'INICIAR_PONTO'),
('Gerenciar Categorias de Acesso', 'GERENCIAR_PERMISSOES');

-- Vincula Permissão Geral ao Super Admin
INSERT INTO rbac_role_permissoes (role_id, permissao_id) VALUES (1, 1), (1, 2), (1, 3), (1, 7);
