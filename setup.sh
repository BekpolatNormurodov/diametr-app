#!/bin/bash
set -e

echo "======================================"
echo "  Diametr — Server Setup Script"
echo "======================================"

# ── 1. Clone sub-repos ────────────────────────────────────────────────────────
echo ""
echo "[1/4] Cloning repos..."

if [ ! -d "diametr_backend/.git" ]; then
  git clone https://github.com/khurshid28/diametr_backend.git diametr_backend
else
  echo "  diametr_backend already cloned, pulling..."
  git -C diametr_backend pull
fi

if [ ! -d "diametr.uz/.git" ]; then
  git clone https://github.com/khurshid28/diametr.uz.git diametr.uz
else
  echo "  diametr.uz already cloned, pulling..."
  git -C diametr.uz pull
fi

if [ ! -d "diametr_dashboard/.git" ]; then
  git clone https://github.com/khurshid28/diametr_dashboard.git diametr_dashboard
else
  echo "  diametr_dashboard already cloned, pulling..."
  git -C diametr_dashboard pull
fi

if [ ! -d "diametr_shop_admin/.git" ]; then
  git clone https://github.com/khurshid28/diametr_shop_admin.git diametr_shop_admin
else
  echo "  diametr_shop_admin already cloned, pulling..."
  git -C diametr_shop_admin pull
fi

# ── 2. Create necessary directories ─────────────────────────────────────────
echo ""
echo "[2/4] Creating directories..."
mkdir -p certbot/www certbot/conf
mkdir -p logs/nginx logs/backend
mkdir -p nginx/cache
mkdir -p diametr_backend/public
mkdir -p mysql_data

# ── 3. Check .env file ────────────────────────────────────────────────────────
echo ""
echo "[3/4] Checking .env..."
if [ ! -f ".env" ]; then
  echo ""
  echo "  .env fayl topilmadi! Quyidagi namunadan nusxa oling:"
  echo "  cp .env.example .env"
  echo "  va keyin nano .env bilan to'ldiring"
  echo ""
  echo "  Keyin qayta ishga tushiring: docker compose up -d --build"
  exit 1
else
  echo "  .env fayl mavjud."
fi

# ── 4. Start Docker Compose ───────────────────────────────────────────────────
echo ""
echo "[4/4] Starting Docker Compose..."
docker compose up -d --build

echo ""
echo "======================================"
echo "  Done! Services are starting..."
echo ""
# echo "  Certbot bilan SSL olish:"
# echo ""
# echo "  sudo certbot --nginx \\"
# echo "    -d diametr.uz -d www.diametr.uz \\"
# echo "    -d api.diametr.uz \\"
# echo "    -d dashboard.diametr.uz -d admin.diametr.uz \\"
# echo "    --email alpdiametr@gmail.com \\"
# echo "    --agree-tos --no-eff-email"
# echo "======================================"
