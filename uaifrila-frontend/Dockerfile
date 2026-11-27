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

# Template do Nginx — o $PORT e substituido na hora de subir
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

# Railway injeta $PORT automaticamente. Local: usa 80.
ENV PORT=80
EXPOSE 80

# Gera a config final com a porta certa e sobe o Nginx
CMD sh -c "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
