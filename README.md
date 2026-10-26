# UAI FRILA v13.2 - FULLSTACK FINAL FIX .js IMPORTS

## FIX APLICADO v13.2
Erro corrigido:
```
Error: Cannot find module './BaseRepository.js'
```
Causa: ts-node-dev usa CommonJS, mas imports estavam com .js (ESM)
Solução: Removido .js de TODOS os imports + tsconfig module=CommonJS

## Estrutura
- uaifrila-frontend/ v13.1 - Design system exato (grids #CC9900 1.2px 36px e #0066FF 1.2px 40px), menu fixo, 10 telas, sem mock
- uaifrila-api/ v13.2 - Pool, sem .js imports, endpoints completos, JWT, Socket.IO
- uaifrila-database/ ddl/ + dml/ separados - relação pais->estado->cidade->bairro, só Uberlândia ativa
- uaifrila-email-worker/ v13.2 - Pool, SKIP LOCKED, limite tentativas, expiração auto

## Como rodar
```bash
# Banco
psql -U uai_frila_app -d uai_frila -f uaifrila-database/ddl/01_paises_estados_cidades_bairros.sql
psql -U uai_frila_app -d uai_frila -f uaifrila-database/ddl/02_usuarios_vagas.sql
psql -U uai_frila_app -d uai_frila -f uaifrila-database/dml/01_geografia.sql
psql -U uai_frila_app -d uai_frila -f uaifrila-database/dml/02_tipos_termos_rbac_variaveis.sql

# API
cd uaifrila-api
npm install
npm run dev  # porta 3000 - deve mostrar 🚀 UAI FRILA API v13.2 rodando

# Frontend
cd uaifrila-frontend
npm install
npm run dev  # porta 5173

# Worker
cd uaifrila-email-worker
npm install
npm run dev
```

## Telas
- Home (descrição antes login)
- Login email + código 5 min
- Cadastro Unificado Freela+Contratante duplex
- Publicar vaga com cálculo horas*valor+Uber+taxa
- Mural sem mock, valor líquido freela / total cartão+Pix contratante, dual não vê próprias
- Candidatos com foto, bairro distância, 4.9★, como chega, Aceitar cria trampo com código início/fim
- Trampos com cronômetro 00:00:00 REAL
- Cidades (ativa/desativa)
- Expansão (crescimento)
- Transações (admin)
- Variáveis ambiente (admin)
- Código Freela
