#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Generate .webp companions for uploaded images that don't have one yet.
#
# This is the SAME lightweight "shrink" we did once by hand (WebP ≈ 43x smaller),
# kept running so NEW banner/news/product images stay light too. No application
# change: nginx already serves "<file>.webp" to any browser/Flutter client that
# accepts WebP (see `try_files $uri$webp_suffix` in nginx-ssl.conf), and falls
# back to the original otherwise.
#
# Install once on the server (see the paste-in block in chat), then cron it every
# couple of minutes. Idempotent + cheap: it skips files that already have a .webp.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

PUBLIC_DIR="${PUBLIC_DIR:-/root/diametr/diametr_backend/public}"
QUALITY="${QUALITY:-80}"

command -v cwebp >/dev/null 2>&1 || {
  echo "cwebp not installed — run: apt-get install -y webp" >&2
  exit 1
}

converted=0
find "$PUBLIC_DIR" -type f \
  \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.bmp' \) \
  | while IFS= read -r f; do
      case "$f" in *.webp) continue ;; esac   # never re-convert a .webp
      [ -f "$f.webp" ] && continue             # already has a companion
      if cwebp -quiet -q "$QUALITY" "$f" -o "$f.webp" >/dev/null 2>&1; then
        converted=$((converted + 1))
        echo "webp: $f"
      fi
    done

echo "done ($(date))"
