-- =====================================================================
-- UAI FRILA - SEED FUNÇÕES (base: categorias EXISTENTES, nenhuma categoria nova)
-- Categorias usadas (já existem em categorias_funcao):
--   Alimentação | Atendimento | Segurança | Limpeza | Eventos | Outros
-- Total: 48 funções (8 já existiam + 40 novas).
-- IDEMPOTENTE: ON CONFLICT (nome) DO NOTHING — não move função de categoria
-- nem duplica se rodar de novo.
-- COMO RODAR: psql -U postgres -d uaifrila -f 02-SEED-FUNCOES.sql
-- =====================================================================
begin;
-- ---------------- Alimentação (10 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Garçom', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Bartender', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Cozinheiro', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Auxiliar de Cozinha', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Churrasqueiro', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Confeiteiro', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Auxiliar de Buffet', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Salgadeiro', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Barista', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Copeiro', (SELECT id FROM categorias_funcao WHERE nome = 'Alimentação')) ON CONFLICT (nome) DO NOTHING;

-- ---------------- Atendimento (6 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Recepcionista', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Caixa', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Promotor de Vendas', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Atendente de Loja', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Hostess', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Bilheteiro', (SELECT id FROM categorias_funcao WHERE nome = 'Atendimento')) ON CONFLICT (nome) DO NOTHING;

-- ---------------- Segurança (4 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Segurança', (SELECT id FROM categorias_funcao WHERE nome = 'Segurança')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Vigilante', (SELECT id FROM categorias_funcao WHERE nome = 'Segurança')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Controlador de Acesso', (SELECT id FROM categorias_funcao WHERE nome = 'Segurança')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Segurança de Evento', (SELECT id FROM categorias_funcao WHERE nome = 'Segurança')) ON CONFLICT (nome) DO NOTHING;

-- ---------------- Limpeza (6 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Limpeza', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Diarista', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Auxiliar de Limpeza', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Jardineiro', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Zelador', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Lavador de Carros', (SELECT id FROM categorias_funcao WHERE nome = 'Limpeza')) ON CONFLICT (nome) DO NOTHING;

-- ---------------- Eventos (10 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Montador de Eventos', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Decorador', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Cerimonialista', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Técnico de Som', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Técnico de Iluminação', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Fotógrafo', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Cinegrafista', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('DJ', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Animador de Festas', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Manobrista', (SELECT id FROM categorias_funcao WHERE nome = 'Eventos')) ON CONFLICT (nome) DO NOTHING;

-- ---------------- Outros (12 funções) ----------------
INSERT INTO funcoes (nome, categoria_id) VALUES ('Outros', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Motorista', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Entregador', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Carregador', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Ajudante Geral', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Pedreiro', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Eletricista', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Encanador', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Pintor', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Montador de Móveis', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Babá', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;
INSERT INTO funcoes (nome, categoria_id) VALUES ('Cuidador de Idosos', (SELECT id FROM categorias_funcao WHERE nome = 'Outros')) ON CONFLICT (nome) DO NOTHING;

-- CONFERIR: SELECT cf.nome AS categoria, COUNT(*) FROM funcoes f JOIN categorias_funcao cf ON cf.id = f.categoria_id GROUP BY cf.nome ORDER BY cf.nome;

---rollback; 
---commit;