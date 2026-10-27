-- Criar/atualizar variavel de antecedencia para vagas
INSERT INTO variaveis_sistema (chave, valor, valor_numerico, tipo, descricao, categoria)
VALUES ('VAGA_ANTECEDENCIA_MINUTOS', '30', 30, 'number', 'Minutos de antecedência mínima para publicar vaga (entrada deve ser > agora + X min)', 'vaga')
ON CONFLICT (chave) DO UPDATE SET valor = '30', valor_numerico = 30, descricao = 'Minutos de antecedência mínima para publicar vaga', atualizado_em = NOW();

-- Atualiza a existente para 30 também para manter compatibilidade
UPDATE variaveis_sistema SET valor = '30', valor_numerico = 30 WHERE chave = 'PAGAMENTO_ANTECEDENCIA_MINUTOS';

SELECT * FROM variaveis_sistema WHERE chave LIKE '%ANTECEDENCIA%';
