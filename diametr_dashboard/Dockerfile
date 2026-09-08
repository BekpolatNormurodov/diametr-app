# ╔══════════════════════════════════════════════════════════════════╗
# ║            Diametr Dashboard  —  React (Vite)                   ║
# ║            Multi-stage build  ·  node:20-alpine + nginx         ║
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

LABEL org.opencontainers.image.title="diametr-dashboard" \
      org.opencontainers.image.description="admin.diametr.uz / dashboard.diametr.uz"

RUN rm /etc/nginx/conf.d/default.conf

COPY .docker/nginx.conf       /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
