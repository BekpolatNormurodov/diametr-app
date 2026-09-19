#!/bin/sh
# Make nginx serve TLS certificates that certbot has renewed.
#
# certbot runs in its own container (`certbot renew` every 12h, webroot mode)
# and cannot signal nginx, so without this nginx keeps serving the OLD
# certificate until the next deploy/reload — on 2026-09-19 a certificate
# renewed on Sep 18 (valid to Dec 17) was on disk while nginx still served one
# expiring Oct 18.
#
# Host cron (root), daily at 23:00 UTC = 04:00 Asia/Tashkent:
#   0 23 * * * /bin/sh /root/diametr/scripts/reload-nginx-certs.sh >> /var/log/nginx-cert-reload.log 2>&1
#
# `nginx -s reload` is graceful: no dropped connections, rate-limit zones and
# the proxy cache survive. The config is tested first; a broken config is
# never reloaded.

NGINX=diametr_nginx
HOST=diametr.uz
WARN_DAYS=14
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if ! docker exec "$NGINX" nginx -t >/dev/null 2>&1; then
  echo "$TS ERROR nginx -t failed, NOT reloaded:"
  docker exec "$NGINX" nginx -t 2>&1 | tail -3
  exit 1
fi

docker exec "$NGINX" nginx -s reload
sleep 2

# What is actually served now (not what is on disk).
END=$(echo | openssl s_client -connect 127.0.0.1:443 -servername "$HOST" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -z "$END" ]; then
  echo "$TS WARNING reloaded, but could not read the served certificate"
  exit 0
fi

DAYS=$(( ( $(date -u -d "$END" +%s) - $(date -u +%s) ) / 86400 ))
if [ "$DAYS" -lt "$WARN_DAYS" ]; then
  echo "$TS WARNING reloaded; served certificate expires in $DAYS days ($END) — check certbot: docker logs diametr_certbot"
else
  echo "$TS OK reloaded; served certificate valid $DAYS more days ($END)"
fi
