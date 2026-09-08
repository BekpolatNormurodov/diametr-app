# ╔══════════════════════════════════════════════════════════════════╗
# ║         Diametr Shop Admin  —  React (Vite)                     ║
# ║         Multi-stage build  ·  node:20-alpine + nginx            ║
# ╚══════════════════════════════════════════════════════════════════╝

# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 1 — builder                                               │
# └──────────────────────────────────────────────────────────────────┘
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time env vars (override via --build-arg if needed)
ARG VITE_BASE_URL=https://api.diametr.uz/api/v1
ARG VITE_STATIC_PATH=https://api.diametr.uz
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_STATIC_PATH=$VITE_STATIC_PATH

COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .
RUN npm run build


# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 2 — nginx (serve static dist)                            │
# └──────────────────────────────────────────────────────────────────┘
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: all routes → index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
