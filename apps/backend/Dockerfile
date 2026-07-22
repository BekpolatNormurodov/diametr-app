# ╔══════════════════════════════════════════════════════════════════╗
# ║              Diametr Backend  —  NestJS + Prisma 6              ║
# ║              Multi-stage build  ·  node:20-alpine               ║
# ╚══════════════════════════════════════════════════════════════════╝

# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 1 — builder                                               │
# │  Installs all deps, generates Prisma client, compiles TypeScript │
# └──────────────────────────────────────────────────────────────────┘
FROM node:20-alpine AS builder

WORKDIR /app

# System deps needed by Prisma (openssl) and bcrypt (python3, make, g++)
RUN apk add --no-cache \
      openssl \
      libc6-compat \
      python3 \
      make \
      g++

# Install node_modules first (better layer cache — only re-runs when package*.json changes)
COPY package*.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps \
 && npm install exceljs --legacy-peer-deps --no-save

# Copy source, generate Prisma client (prismaSchemaFolder), build
COPY . .
RUN npx prisma generate \
 && npm run build


# ┌──────────────────────────────────────────────────────────────────┐
# │  Stage 2 — production                                            │
# │  Lean runtime image — no dev tools, no source code              │
# └──────────────────────────────────────────────────────────────────┘
FROM node:20-alpine

LABEL org.opencontainers.image.title="diametr-backend" \
      org.opencontainers.image.description="Diametr NestJS API" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Runtime dependencies only
#   tini         — forwards SIGTERM correctly to Node
#   netcat-openbsd — used by docker-entrypoint.sh to wait for MySQL
RUN apk add --no-cache \
      openssl \
      libc6-compat \
      tini \
      netcat-openbsd \
 && mkdir -p /app/logs

# Copy built artefacts from builder
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/prisma        ./prisma
COPY --from=builder /app/public        ./public
COPY package*.json ./
# tsconfig needed so ts-node can run seed scripts inside the container
COPY tsconfig.json tsconfig.build.json ./

# ── Telegram bot runtime environment ─────────────────────────────────
# TELEGRAM_BOT_TOKEN    — BotFather dan olingan token
# TELEGRAM_CHAT_IDS     — bildirishnoma VA command huquqi bor chat IDlar
#                         (vergul bilan ajratilgan: 123456789,-100987654321)
# BACKEND_URL           — webhook manzili (https://api.diametr.uz)
# STORE_BOT_TOKEN       — do'kon boti tokeni
# STORE_BOT_WEBHOOK_URL — do'kon boti webhook manzili
#
# Bu qiymatlar SHU YERDA berilmaydi. Dockerfile'dagi ENV image qatlamiga
# yoziladi va image'ga kirgan har kim uni o'qiy oladi. Barchasi
# docker-compose.yaml orqali .env dan uzatiladi — namuna: .env.example


# Startup script:
#   1. waits for MySQL to accept connections
#   2. runs `prisma migrate deploy`
#   3. starts `node dist/main`
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8888

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
