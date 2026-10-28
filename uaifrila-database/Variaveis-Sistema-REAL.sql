-- Tabela real variaveis_sistema existente:
-- id serial, chave varchar(100), valor varchar(500), valor_numerico numeric(12,2),
-- tipo varchar(20), descricao text, categoria varchar(50), editavel bool,
-- criado_em timestamp, atualizado_em timestamp

-- Upsert usando colunas reais
INSERT INTO public.variaveis_sistema (chave, valor, valor_numerico, tipo, descricao, categoria, editavel)
VALUES 
  ('VALOR_MINIMO_VAGA', '75', 75.00, 'number', 'Valor minimo que contratante pode solicitar um servico (R$)', 'vagas', true),
  ('TAXA_PIX_PERCENTUAL', '1', 1.00, 'number', 'Taxa PIX 1% sobre subtotal servico', 'financeiro', true),
  ('TAXA_CARTAO_PERCENTUAL', '4', 4.00, 'number', 'Taxa Cartao 4% sobre subtotal servico', 'financeiro', true),
  ('COMISSAO_APLICATIVO', '10', 10.00, 'number', 'Comissao aplicativo 10% sobre subtotal', 'financeiro', true),
  ('TAXA_PLATAFORMA_PERCENTUAL', '10', 10.00, 'number', 'Alias para COMISSAO_APLICATIVO compatibilidade', 'financeiro', true),
  ('VAGA_ANTECEDENCIA_MINUTOS', '30', 30.00, 'number', 'Antecedencia minima para criar vaga em minutos', 'vagas', true)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  valor_numerico = EXCLUDED.valor_numerico,
  tipo = EXCLUDED.tipo,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  editavel = EXCLUDED.editavel,
  atualizado_em = NOW();

-- Verifica
SELECT chave, valor, valor_numerico, tipo, categoria, editavel, atualizado_em
FROM public.variaveis_sistema
WHERE chave IN ('VALOR_MINIMO_VAGA','TAXA_PIX_PERCENTUAL','TAXA_CARTAO_PERCENTUAL','COMISSAO_APLICATIVO','TAXA_PLATAFORMA_PERCENTUAL','VAGA_ANTECEDENCIA_MINUTOS')
ORDER BY categoria, chave;
