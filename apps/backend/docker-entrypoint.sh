#!/bin/sh
set -e

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"

echo "[entrypoint] Waiting for MySQL at ${DB_HOST}:${DB_PORT} ..."
until nc -zw 3 "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    sleep 3
done
echo "[entrypoint] MySQL is ready."

# If migrations exist, apply them. Otherwise fall back to `db push` so
# the schema (including new models like Settings) is synced to the database.
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null | grep -v '^migration_lock\.toml$' || true)" ]; then
    echo "[entrypoint] Running Prisma migrate deploy ..."
    npx prisma migrate deploy
else
    echo "[entrypoint] No migrations found — running Prisma db push ..."
    # NB: without --accept-data-loss prisma will refuse if a destructive
    # change is detected. That is intentional for production safety.
    npx prisma db push --skip-generate
fi

echo "[entrypoint] Starting NestJS application ..."
# Nest build output: when only src/ is compiled, entry is dist/main.js;
# if prisma/ is also compiled, entry is dist/src/main.js. Pick whichever exists.
if [ -f dist/src/main.js ]; then
    exec node dist/src/main
elif [ -f dist/main.js ]; then
    exec node dist/main
else
    echo "[entrypoint] ERROR: no compiled entry found in dist/" >&2
    ls -la dist || true
    exit 1
fi
