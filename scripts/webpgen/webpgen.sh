#!/bin/bash
LOCK=/tmp/webpgen.lock
exec 9>"$LOCK" || exit 0
flock -n 9 || exit 0
docker run --rm -m 768m -v /root/diametr/diametr_backend/public:/data diametr-webpgen node /app/gen.js
