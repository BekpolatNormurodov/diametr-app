# ╔══════════════════════════════════════════════════════════════════╗
# ║            Diametr Frontend  —  React (CRA)                     ║
# ║            Multi-stage build  ·  node:18-alpine + nginx         ║
# ╚══════════════════════════════════════════════════════════════════╝

# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 1 — builder                                               │
# └──────────────────────────────────────────────────────────────────┘
FROM node:18-alpine AS builder

WORKDIR /app

# CRA / react-scripts requires legacy OpenSSL provider on Node 18+
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .

ARG REACT_APP_BASE_URL=https://api.diametr.uz
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL

RUN npm run build


# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 2 — nginx (serve static build)                           │
# └──────────────────────────────────────────────────────────────────┘
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="diametr-frontend" \
      org.opencontainers.image.description="diametr.uz public site"

RUN rm /etc/nginx/conf.d/default.conf

COPY .docker/nginx.conf        /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
