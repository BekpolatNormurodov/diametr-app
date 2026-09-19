# Live WebP generator (production)

This is the generator that actually runs in production — **not** `scripts/generate-webp.sh`.

- Host cron: `*/3 * * * * /root/imgtool/webpgen.sh >> /var/log/webpgen.log 2>&1`
- `webpgen.sh` takes a flock and runs `docker run --rm -m 768m -v /root/diametr/diametr_backend/public:/data diametr-webpgen node /app/gen.js`
- `gen.js` (sharp): converts `public/<folder>/*.{png,jpg,jpeg}` to `<file>.webp` (max width 1080, q82, EXIF auto-rotate). It writes atomically (tmp + rename), regenerates 0-byte outputs, and skips sources modified in the last 60 s.
- nginx serves `$uri.webp` to clients that accept WebP (`try_files $uri$webp_suffix`).

Deploy a change: copy these files to `/root/imgtool/` on the server, then `docker build -t diametr-webpgen /root/imgtool`.
