# UaiFrila API — Node 20
FROM node:20-alpine

WORKDIR /app

# Instala dependências primeiro (aproveita cache do Docker)
COPY package*.json ./
RUN npm ci --omit=dev || npm install

# Copia o resto e compila
COPY . .
RUN npm run build

# Só o necessário em produção
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
