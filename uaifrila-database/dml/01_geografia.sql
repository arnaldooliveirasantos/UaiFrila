-- DML - Inclusão Geografia - Só Uberlândia ativa inicialmente
INSERT INTO paises (nome) VALUES ('Brasil') ON CONFLICT (nome) DO NOTHING;
INSERT INTO estados (pais_id, nome, sigla) VALUES (1, 'Minas Gerais', 'MG') ON CONFLICT (sigla) DO NOTHING;
INSERT INTO cidades (estado_id, nome, ativo) VALUES (1, 'Uberlândia', TRUE), (1, 'Uberaba', FALSE), (1, 'Araguari', FALSE) ON CONFLICT DO NOTHING;
INSERT INTO bairros (cidade_id, nome) VALUES (1, 'Centro'), (1, 'Granja Marileusa'), (1, 'Karaíba'), (1, 'Santa Mônica'), (1, 'Umuarama'), (1, 'Jardim Karaíba'), (1, 'Morada da Colina'), (1, 'Patrimônio'), (1, 'Laranjeiras'), (1, 'Segismundo Pereira'), (1, 'Custódio Pereira'), (1, 'Jardim Europa'), (1, 'Luizote'), (1, 'Planalto'), (1, 'Chácaras Tubalina'), (1, 'Mansões Aeroporto'), (1, 'Jardim Célia'), (1, 'Vigilato Pereira') ON CONFLICT DO NOTHING;
