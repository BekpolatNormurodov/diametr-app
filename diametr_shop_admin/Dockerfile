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

# SPA config: index.html no-store (so deploys show up without a hard refresh),
# hashed assets immutable, gzip. See nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
