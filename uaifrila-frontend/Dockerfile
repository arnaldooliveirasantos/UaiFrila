# UaiFrila Frontend — Vite + React
# Build com Node, serve com Nginx (SPA com fallback para index.html)

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variavel de build do Vite — passada no build da Railway:
# docker build --build-arg VITE_API_URL=https://hom-api.uaifrila.com.br .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Serve ---
FROM nginx:alpine

# Config do Nginx (SPA fallback + cache de assets)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Saida do Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
