-- DML - Carga Inicial de Dados
INSERT INTO paises (nome) VALUES ('Brasil');
INSERT INTO estados (nome, sigla) VALUES ('Minas Gerais', 'MG');
INSERT INTO cidades (estado_id, nome, ativo) VALUES (1, 'Uberlândia', TRUE), (1, 'Uberaba', FALSE);
INSERT INTO bairros (cidade_id, nome) VALUES (1, 'Centro'), (1, 'Granja Marileusa'), (1, 'Karaíba'), (1, 'Santa Mônica'), (1, 'Umuarama');
INSERT INTO variaveis_ambiente (chave, valor, descricao) VALUES ('TAXA_INTERMEDIACAO_PERCENTUAL', '10', 'Taxa retida'), ('TAXA_CARTAO_PERCENTUAL', '14', 'Taxa cartão');
INSERT INTO usuarios (whatsapp, senha, nome_completo, is_admin, role) VALUES ('34999900000', 'admin123', 'Super Admin', TRUE, 'SUPER_ADMIN');
