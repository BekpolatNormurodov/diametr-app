#!/bin/sh
# Runs daily via Alpine crond.
# Rotates & gzips nginx *.log files older than 1 day.
# Keeps 30 days of archives.

set -e

LOG_DIR="/logs/nginx"
ARCHIVE_DIR="/logs/nginx/archives"
KEEP_DAYS=30

mkdir -p "$ARCHIVE_DIR"

DATE=$(date +%Y-%m-%d)

for log_file in "$LOG_DIR"/*.log; do
    [ -f "$log_file" ] || continue
    base=$(basename "$log_file" .log)
    archive="$ARCHIVE_DIR/${base}-${DATE}.log.gz"

    # Only archive if the log has content
    if [ -s "$log_file" ]; then
        gzip -c "$log_file" > "$archive"
        # Truncate (not delete) so nginx can keep writing
        > "$log_file"
        echo "[rotate-logs] Archived: $archive"
    fi
done

# Remove archives older than KEEP_DAYS
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +${KEEP_DAYS} -delete
echo "[rotate-logs] Done. Archives older than ${KEEP_DAYS} days removed."
