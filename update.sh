#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  Diametr — deploy everything from this one repository.
#
#    ./update.sh              pull, rebuild what changed, restart, verify
#    ./update.sh nginx        config-only reload (no rebuild, no downtime)
#    ./update.sh web          rebuild + restart one service
#    ./update.sh --no-pull    deploy what is already checked out
#    ./update.sh --images     only regenerate WebP companions
#
#  Services: backend web dashboard shop_admin nginx
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; DIM=$'\033[2m'; RST=$'\033[0m'
step() { echo; echo "${GRN}==>${RST} $*"; }
warn() { echo "${YLW}[warn]${RST} $*"; }
die()  { echo "${RED}[fail]${RST} $*" >&2; exit 1; }

PULL=1; ONLY=""; IMAGES_ONLY=0
for a in "$@"; do
  case "$a" in
    --no-pull) PULL=0 ;;
    --images)  IMAGES_ONLY=1 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *)         ONLY="$a" ;;
  esac
done

[ -f .env ] || die ".env topilmadi. cp .env.example .env va to'ldiring."

# ── 1. Pull ──────────────────────────────────────────────────────────────────
if [ "$PULL" = 1 ]; then
  step "Pulling"
  BEFORE=$(git rev-parse HEAD)
  git pull --ff-only || die "git pull failed (local changes? try: git stash)"
  AFTER=$(git rev-parse HEAD)
  if [ "$BEFORE" = "$AFTER" ]; then
    echo "${DIM}   already up to date ($(git rev-parse --short HEAD))${RST}"
  else
    git --no-pager log --oneline "$BEFORE..$AFTER" | sed 's/^/   /'
  fi
  CHANGED=$(git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null || true)
else
  CHANGED=""
  step "Skipping pull (--no-pull)"
fi

# ── 2. WebP companions ───────────────────────────────────────────────────────
# Uploads are stored at full camera resolution; nginx serves a <file>.webp
# companion (~55x smaller) to any client that can decode it. Cron keeps this
# current, but run it here too so a fresh deploy is never left without them.
step "Generating WebP companions"
docker build -q -t diametr-webpgen infra/webpgen >/dev/null
./infra/webpgen/webpgen.sh 2>&1 | sed 's/^/   /' || warn "generator returned non-zero"

[ "$IMAGES_ONLY" = 1 ] && { echo; echo "${GRN}Done (images only).${RST}"; exit 0; }

# ── 3. Decide what to rebuild ────────────────────────────────────────────────
# Only rebuild services whose source actually changed — a full rebuild of all
# four apps takes several minutes on this box.
declare -A SRC=(
  [backend]="apps/backend"
  [web]="apps/web"
  [dashboard]="apps/dashboard"
  [shop_admin]="apps/shop-admin"
)
REBUILD=()
if [ -n "$ONLY" ]; then
  [ "$ONLY" = "nginx" ] || REBUILD=("$ONLY")
elif [ "$PULL" = 0 ]; then
  REBUILD=(backend web dashboard shop_admin)     # can't diff — rebuild all
else
  for svc in "${!SRC[@]}"; do
    if grep -q "^${SRC[$svc]}/" <<<"$CHANGED"; then REBUILD+=("$svc"); fi
  done
fi

if [ ${#REBUILD[@]} -gt 0 ]; then
  step "Rebuilding: ${REBUILD[*]}"
  docker compose build "${REBUILD[@]}"
  docker compose up -d --no-deps "${REBUILD[@]}"
else
  echo "${DIM}   no application source changed — nothing to rebuild${RST}"
fi

# ── 4. nginx ─────────────────────────────────────────────────────────────────
# The config is bind-mounted as a FILE, and Docker binds it by inode. Writing it
# with mv/scp creates a new inode and the running container keeps reading the old
# one — `nginx -s reload` then silently does nothing. Detect that and recreate.
step "nginx"
HOST_INO=$(stat -c %i infra/nginx/nginx-ssl.conf)
CTR_INO=$(docker exec diametr_nginx stat -c %i /etc/nginx/nginx.conf 2>/dev/null || echo 0)
if [ "$HOST_INO" != "$CTR_INO" ]; then
  warn "config inode diverged (host=$HOST_INO container=$CTR_INO) — recreating nginx"
  docker compose up -d --force-recreate nginx
  sleep 5
else
  docker exec diametr_nginx nginx -t >/dev/null 2>&1 || die "nginx config test FAILED — not reloading"
  docker exec diametr_nginx nginx -s reload
  echo "   reloaded"
fi

# ── 5. Certificates ──────────────────────────────────────────────────────────
# certbot renews the files but cannot reload nginx, which keeps serving the
# certificate it loaded at startup. Compare disk vs wire and reload if they drift.
step "Certificates"
DISK=$(openssl x509 -in certbot/conf/live/diametr.uz/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2 || echo "?")
WIRE=$(echo | openssl s_client -servername diametr.uz -connect 127.0.0.1:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "?")
echo "   on disk: $DISK"
echo "   served : $WIRE"
if [ "$DISK" != "$WIRE" ] && [ "$DISK" != "?" ]; then
  warn "nginx is serving a stale certificate — reloading"
  docker exec diametr_nginx nginx -s reload
fi

# ── 6. Verify ────────────────────────────────────────────────────────────────
step "Health"
sleep 3
FAIL=0
for u in https://diametr.uz/ https://api.diametr.uz/api/v1/category/all \
         https://shop.diametr.uz/ https://dashboard.diametr.uz/; do
  code=$(curl -sS -o /dev/null --max-time 20 -w '%{http_code}' "$u" 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then printf "   ${GRN}ok${RST}   %-46s %s\n" "$u" "$code"
  else                         printf "   ${RED}FAIL${RST} %-46s %s\n" "$u" "$code"; FAIL=1; fi
done

# A product image must come back as WebP and be small — this is the regression
# that matters most, so assert it rather than eyeballing it.
IMG=$(curl -sS --max-time 20 "https://api.diametr.uz/api/v1/product/all" 2>/dev/null \
      | grep -o '"image":"[^"]*"' | head -1 | sed 's/"image":"//;s/"//')
if [ -n "$IMG" ]; then
  read -r TYPE SIZE < <(curl -sS -o /dev/null --max-time 30 \
    -H 'Accept: image/webp,*/*' -w '%{content_type} %{size_download}' \
    "https://api.diametr.uz/static/products/$IMG" 2>/dev/null)
  printf "   image: %s  %s KB  " "$TYPE" "$((SIZE/1024))"
  if [ "$TYPE" = "image/webp" ] && [ "$SIZE" -lt 1000000 ]; then echo "${GRN}ok${RST}"
  else echo "${RED}NOT OPTIMISED${RST}"; FAIL=1; fi
fi

docker compose ps --format '   {{.Name}}\t{{.Status}}' 2>/dev/null || docker compose ps

echo
[ "$FAIL" = 0 ] && echo "${GRN}Deploy OK.${RST}" || { echo "${RED}Deploy finished with failures.${RST}"; exit 1; }
