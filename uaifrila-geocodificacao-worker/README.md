# Worker de Geocodificacao
Preenche latitude/longitude dos enderecos salvos SEM coordenadas.

## Por que existe
Salvar endereco NUNCA trava por causa do Nominatim (servico externo, com limite de 1 req/segundo, que cai).
Quando a geocodificacao falha, a API salva o endereco sem coordenada, loga o motivo e deixa o endereco
na fila. Este worker tenta de novo, com backoff, ate conseguir ou desistir.

## Rodar
1. `psql -U postgres -d uaifrila -f ../uaifrila-database/02-GEOCODIFICACAO-ENDERECO.sql`
2. `cp .env.example .env` e ajuste `DATABASE_URL`
3. `npm install && npm run build && npm start` (dev: `npm run dev`)

## Regras
- Lote com `FOR UPDATE SKIP LOCKED`: 2 instancias nao pegam o mesmo endereco.
- 1 req/segundo para o Nominatim (sleep 1100ms).
- So tenta de novo apos `GEOCODIFICACAO_RETRY_MINUTOS` (padrao 60) desde a ultima tentativa.
- Desiste apos `GEOCODIFICACAO_MAX_TENTATIVAS` (padrao 10). Para reativar: zere `geocodificacao_tentativas`.
- Nunca apaga coordenada existente, nunca inventa coordenada.
- Todo erro gera log com erro. Sem fallback.
