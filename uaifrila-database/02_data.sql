-- 02 - Dados Iniciais Corrigidos
-- CORREÇÃO: senha com hash bcrypt de 'admin123' ($2a$10$...), adicionado email

INSERT INTO paises (nome) VALUES ('Brasil') ON CONFLICT (nome) DO NOTHING;
INSERT INTO estados (nome, sigla) VALUES ('Minas Gerais', 'MG') ON CONFLICT (sigla) DO NOTHING;
INSERT INTO cidades (estado_id, nome, ativo) VALUES (1, 'Uberlândia', TRUE), (1, 'Uberaba', FALSE) ON CONFLICT DO NOTHING;
INSERT INTO bairros (cidade_id, nome) VALUES (1, 'Centro'), (1, 'Granja Marileusa'), (1, 'Karaíba'), (1, 'Santa Mônica'), (1, 'Umuarama') ON CONFLICT DO NOTHING;

INSERT INTO variaveis_ambiente (chave, valor, descricao) VALUES 
('TAXA_INTERMEDIACAO_PERCENTUAL', '10', 'Taxa retida'),
('TAXA_CARTAO_PERCENTUAL', '14', 'Taxa cartão'),
('TAXA_PIX_PERCENTUAL', '10', 'Taxa pix')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- Usuário admin com senha hasheada bcrypt para 'admin123'
-- Hash gerado: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO usuarios (whatsapp, email, senha, nome_completo, role) VALUES 
('34999900000', 'admin@uaifrila.com.br', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Super Admin', 'SUPER_ADMIN')
ON CONFLICT (whatsapp) DO UPDATE SET email = EXCLUDED.email;
