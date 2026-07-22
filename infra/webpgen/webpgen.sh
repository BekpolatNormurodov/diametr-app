#!/bin/bash
# Generate missing "<file>.webp" companions for uploaded images.
# Installed by setup.sh as a cron entry running every 3 minutes.
#
# The flock guard matters: the first run over a full catalogue takes minutes,
# and without it cron would stack overlapping conversions on a 1.9 GB box.

LOCK=/tmp/webpgen.lock
exec 9>"$LOCK" || exit 0
flock -n 9 || exit 0          # a run is already in progress — nothing to do

# Resolve the repo root from this script's location, so the cron entry works
# regardless of the working directory it is invoked from.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

docker run --rm -m 768m \
  -v "$REPO_ROOT/apps/backend/public:/data" \
  diametr-webpgen node /app/gen.js
