# Diametr

Uzbek construction-materials marketplace: NestJS API, three React front-ends, and a
Flutter mobile app, deployed together with Docker Compose behind nginx.

Previously five separate repositories; consolidated into this one.

## Layout

```
apps/
  backend/      NestJS + Prisma + MySQL      -> api.diametr.uz
  web/          Create React App             -> diametr.uz
  dashboard/    Vite + React (super admin)   -> dashboard.diametr.uz, admin.diametr.uz
  shop-admin/   Vite + React (shop owners)   -> shop.diametr.uz
  mobile/       Flutter (com.diametr.diametr_mobile, Play Store)
infra/
  nginx/        reverse proxy + TLS + static image serving
  webpgen/      WebP companion generator (see "Images" below)
  scripts/      log rotation
docker-compose.yaml
setup.sh
```

Runtime data — `logs/`, `mysql_data/`, `certbot/`, `apps/backend/public/*`,
`infra/nginx/cache*` — lives on the server and is deliberately not in git.

## Mobile app

`apps/mobile` is the published app. Identify the version from `pubspec.yaml`
(`version:`) and `android/local.properties` — **not** from the directory name.
Three stale copies with the same `applicationId` existed before consolidation and
were dropped; this is the only source of truth.

Building a release needs two files that are **not** in this repo and must be
restored from a secure backup:

```
apps/mobile/android/app/app.jks
apps/mobile/android/key.properties
```

Lose `app.jks` and you can no longer ship updates to the existing Play Store
listing. Back it up somewhere that is not this repository.

## Images

Uploads are stored at full camera resolution. Measured in production: 387 files,
2.2 GB, mean 5.9 MB, p50 7.5 MB, max 10.2 MB — 364 of them PNG with no alpha
channel. A single category screen pulled ~168 MB.

Rather than rewrite the originals, `infra/webpgen` generates a `<file>.webp`
companion beside each one, and nginx serves it to clients that can decode WebP:

```nginx
map $http_accept     $webp_from_accept { default ""; "~*webp" ".webp"; }
map $http_user_agent $webp_suffix      { default $webp_from_accept; "~*Dart/" ".webp"; }

location /static/ {
    root /var/www;
    try_files $uri$webp_suffix $uri @static_backend;
}
```

The `Dart/` arm matters: Flutter's `CachedNetworkImage` sends no `Accept` header
but does identify itself in the User-Agent. Anything that advertises neither gets
the untouched original, so old clients keep working.

Measured result on a 20-product catalogue screen: **167.8 MB -> 2.8 MB (59x)**.
Because the URL, the database and the API payload are all unchanged, the already
published mobile app got this without a store release.

`apps/backend/public` is mounted read-only into nginx, so images are served from
disk with `sendfile` and never travel through the Node process.

## Deploying

```bash
git pull
docker compose up -d --build
```

### Two traps worth knowing

**1. Editing a bind-mounted config file.** `docker-compose.yaml` mounts
`nginx-ssl.conf` as a *file*. Docker binds it by inode, so replacing it with
`mv` (or `scp` straight over it) leaves the running container reading the old
file — `nginx -s reload` then appears to do nothing. Always write in place:

```bash
cp new-nginx.conf infra/nginx/nginx-ssl.conf     # same inode
docker exec diametr_nginx nginx -t && docker exec diametr_nginx nginx -s reload
```

If the inode has already diverged, `docker restart diametr_nginx` re-resolves it.

**2. Line endings.** A CRLF `.conf` or `.sh` file breaks inside Alpine in
confusing ways. `.gitattributes` pins these to LF; do not override it.

### Certificates

certbot renews into `certbot/conf`, but **nginx does not pick up a renewed
certificate on its own** — it keeps serving the one it loaded at start. Reload it
after any renewal:

```bash
docker exec diametr_nginx nginx -s reload
echo | openssl s_client -servername diametr.uz -connect diametr.uz:443 2>/dev/null \
  | openssl x509 -noout -enddate
```

Worth wiring into a certbot deploy hook.

## Known issues

- Admin and worker passwords are stored and compared in plaintext
  (`apps/backend/src/auth/auth.service.ts`). `bcrypt` is already a dependency but
  unused.
- `GET /product/all` ignores `page` and `limit` and returns the entire catalogue
  (345 products, ~190 KB) in one response.
- `prisma_studio` runs in production. It is bound to `127.0.0.1` only, so it is
  not publicly reachable, but it does not belong in a production compose file.
