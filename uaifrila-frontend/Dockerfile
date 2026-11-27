# UaiFrila Frontend — Vite + React
# Build com Node, serve com Nginx na porta $PORT da Railway

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Serve ---
FROM nginx:alpine

# Config do Nginx com placeholder __PORT__ (trocado pelo start.sh)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Script de inicializacao: troca __PORT__ pela porta da Railway e sobe o Nginx
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV PORT=80
EXPOSE 80

CMD ["sh", "/start.sh"]
