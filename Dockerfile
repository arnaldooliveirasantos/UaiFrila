# UaiFrila Frontend — Dockerfile para a RAIZ do monorepo
# Colocar este arquivo na raiz do repo (onde estao uaifrila-api, uaifrila-frontend, ...)
# Build com Node, serve com Nginx na porta $PORT da Railway

FROM node:20-alpine AS build
WORKDIR /app

# So o front — nao o repo inteiro
COPY uaifrila-frontend/package*.json ./
RUN npm ci

COPY uaifrila-frontend/ ./

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Serve ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV PORT=80
EXPOSE 80

CMD ["sh", "/start.sh"]
