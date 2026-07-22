#!/bin/bash
set -e

echo "======================================"
echo "  Diametr — Server Setup"
echo "======================================"

# Everything lives in this one repository now. There is nothing to clone:
# the five former repos (diametr_backend, diametr.uz, diametr_dashboard,
# diametr_shop_admin, stroymarket) are directories under apps/.

# ── 1. Runtime directories (not in git) ──────────────────────────────────────
echo ""
echo "[1/4] Creating runtime directories..."
mkdir -p certbot/www certbot/conf
mkdir -p logs/nginx logs/backend
mkdir -p infra/nginx/cache infra/nginx/cache-static
mkdir -p apps/backend/public/{products,product-items,shops,categories,ads}
mkdir -p mysql_data

# ── 2. .env ──────────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Checking .env..."
if [ ! -f ".env" ]; then
  echo ""
  echo "  .env fayl topilmadi! Namunadan nusxa oling:"
  echo "    cp .env.example .env"
  echo "    nano .env"
  echo ""
  echo "  Keyin qayta ishga tushiring: ./setup.sh"
  exit 1
fi
echo "  .env mavjud."

# ── 3. WebP generator ────────────────────────────────────────────────────────
# Uploaded images are stored at full camera resolution (7-10 MB PNGs). nginx
# serves a pre-generated "<file>.webp" companion — ~55x smaller — to any client
# that can decode WebP, and the untouched original to anything that cannot.
# See `location /static/` in infra/nginx/nginx-ssl.conf.
echo ""
echo "[3/4] Building the WebP generator image..."
docker build -q -t diametr-webpgen infra/webpgen

if ! crontab -l 2>/dev/null | grep -q 'webpgen.sh'; then
  echo "  Installing cron entry (every 3 minutes)..."
  ( crontab -l 2>/dev/null; \
    echo "*/3 * * * * $(pwd)/infra/webpgen/webpgen.sh >> /var/log/webpgen.log 2>&1" ) | crontab -
else
  echo "  cron entry already present."
fi

echo "  Generating any missing .webp companions (first run can take a few minutes)..."
./infra/webpgen/webpgen.sh || echo "  (generator returned non-zero — check /var/log/webpgen.log)"

# ── 4. Start ─────────────────────────────────────────────────────────────────
echo ""
echo "[4/4] Starting Docker Compose..."
docker compose up -d --build

echo ""
echo "======================================"
echo "  Done."
echo ""
echo "  Health:  docker compose ps"
echo "  Logs:    docker compose logs -f nginx"
echo ""
echo "  NOTE: when you change infra/nginx/nginx-ssl.conf, update it IN PLACE"
echo "  (cp over the file). Replacing it with mv creates a new inode and the"
echo "  running container keeps serving the old config — see docs in README."
echo "======================================"
