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
#
# Cron line (host crontab, runs as root every 2 minutes, never overlaps):
#   */2 * * * * flock -n /tmp/webp.lock /bin/sh /root/diametr/scripts/generate-webp.sh >>/var/log/diametr-webp.log 2>&1
# The script ALSO takes its own non-blocking flock on $LOCK_FILE (a different
# file), so a manual run or an old cron line without `flock` cannot run a second
# cwebp in parallel on this small-memory host either. Do not point the cron
# wrapper at $LOCK_FILE itself — the two locks would block each other.
#
# Why the loop looks the way it does — nginx serves every companion with
# "immutable, max-age=1 year", browsers and the Flutter disk cache keep it, so a
# broken .webp under the real name can never be taken back:
#   * Atomic write: cwebp writes "<file>.webp.tmp.<pid>"; only a complete,
#     non-empty result is renamed onto "<file>.webp" (rename is atomic).
#   * Empty companions (left by the old in-place version of this script when
#     cwebp was killed) are regenerated instead of skipped.
#   * Images modified less than a minute ago are skipped — the upload may still
#     be streaming to disk. The next run picks them up.
#   * If cwebp cannot convert an image (corrupt, wider/taller than 16383 px, …)
#     a "<file>.webp.skip" marker stops it being decoded again every run. It is
#     retried when the image changes or the marker is a day old. nginx keeps
#     serving the original for it (correct, just not smaller).
#   * EXIF orientation: cwebp neither rotates the pixels nor keeps the EXIF tag,
#     so a JPEG with Orientation != 1 would turn sideways as WebP while the
#     original shows upright. Such JPEGs get a skip marker instead, so nginx
#     serves the upright original. The tag is read with perl (perl-base is
#     Essential on Debian/Ubuntu, i.e. always installed). Without perl JPEGs are
#     not converted at all. Auto-rotating instead would need ImageMagick or
#     exiftran, which the server does not have. (PNG eXIf orientation is not
#     handled — practically never present in uploads.)
#
# One-off repair of companions made by the old script for rotated JPEGs
# (removes those .webp so nginx serves the upright original again):
#   RECHECK_JPEG=1 flock -n /tmp/webp.lock /bin/sh /root/diametr/scripts/generate-webp.sh
# ─────────────────────────────────────────────────────────────────────────────
set -eu

PUBLIC_DIR="${PUBLIC_DIR:-/root/diametr/diametr_backend/public}"
QUALITY="${QUALITY:-80}"
LOCK_FILE="${LOCK_FILE:-/tmp/diametr-generate-webp.lock}"
RECHECK_JPEG="${RECHECK_JPEG:-0}"

command -v cwebp >/dev/null 2>&1 || {
  echo "cwebp not installed — run: apt-get install -y webp" >&2
  exit 1
}

# Single instance (fd 9 stays open — and locked — until the script exits).
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "previous run still working — skipped ($(date))"
    exit 0
  fi
else
  echo "warning: flock not found — running without the single-instance lock" >&2
fi

HAVE_PERL=0
if command -v perl >/dev/null 2>&1; then
  HAVE_PERL=1
else
  echo "warning: perl not found — JPEG files are not converted (EXIF orientation cannot be checked)" >&2
fi

# Prints the EXIF Orientation (1-8) of the JPEG "$1", or nothing when the file
# has no such tag. Non-zero exit = could not tell (not a JPEG, truncated, odd EXIF).
jpeg_orientation() {
  perl -e '
    use strict; use warnings;
    open(my $fh, "<:raw", $ARGV[0]) or exit 2;
    sub rd { my $n = shift; my $b = ""; my $got = read($fh, $b, $n);
             return (defined $got && $got == $n) ? $b : undef; }
    my $soi = rd(2);
    exit 3 unless defined $soi && $soi eq "\xFF\xD8";
    while (1) {
      my $c = rd(1);
      exit 4 unless defined $c && $c eq "\xFF";
      my $m;
      do { $m = rd(1); exit 4 unless defined $m; } while ($m eq "\xFF");
      my $mk = ord $m;
      exit 0 if $mk == 0xD9 || $mk == 0xDA;              # EOI / start of scan: no EXIF
      next if $mk == 0x01 || ($mk >= 0xD0 && $mk <= 0xD7); # markers without a length
      my $l = rd(2);
      exit 4 unless defined $l;
      my $len = unpack("n", $l);
      exit 4 if $len < 2;
      if ($mk == 0xE1) {
        my $seg = rd($len - 2);
        exit 4 unless defined $seg;
        next unless length($seg) >= 14 && substr($seg, 0, 6) eq "Exif\0\0";
        my $t = substr($seg, 6);
        my ($s, $L);
        if    (substr($t, 0, 2) eq "II") { ($s, $L) = ("v", "V"); }
        elsif (substr($t, 0, 2) eq "MM") { ($s, $L) = ("n", "N"); }
        else  { exit 5; }
        exit 5 unless unpack($s, substr($t, 2, 2)) == 42;
        my $ifd = unpack($L, substr($t, 4, 4));
        exit 5 if $ifd + 2 > length($t);
        my $cnt = unpack($s, substr($t, $ifd, 2));
        for my $i (0 .. $cnt - 1) {
          my $e = $ifd + 2 + 12 * $i;
          exit 5 if $e + 12 > length($t);
          next unless unpack($s, substr($t, $e, 2)) == 0x0112;
          my $type = unpack($s, substr($t, $e + 2, 2));
          if    ($type == 3) { print unpack($s, substr($t, $e + 8, 2)), "\n"; }
          elsif ($type == 4) { print unpack($L, substr($t, $e + 8, 4)), "\n"; }
          else  { exit 5; }
          exit 0;
        }
        exit 0;                                          # EXIF without Orientation
      }
      seek($fh, $len - 2, 1) or exit 4;
    }
  ' "$1"
}

# True when "$1" is a JPEG whose pixels would come out rotated wrongly as WebP
# (orientation other than 1, or orientation that cannot be determined).
jpeg_needs_rotation() {
  o=$(jpeg_orientation "$1" 2>/dev/null) || return 0
  case "$o" in
    ""|1) return 1 ;;
    *)    return 0 ;;
  esac
}

# True while a "<image>.webp.skip" marker is still in force.
skip_marked() {
  m="$1.webp.skip"
  [ -e "$m" ] || return 1
  [ -n "$(find "$m" -mmin +1440 2>/dev/null)" ] && return 1  # retry daily
  [ -n "$(find "$1" -newer "$m" 2>/dev/null)" ] && return 1  # image changed
  return 0
}

mark_skip() {
  touch "$1.webp.skip" 2>/dev/null || :
}

# Leftovers of a run that was killed mid-encode (never served: nginx only looks
# for "<file>.webp").
find "$PUBLIC_DIR" -type f -name '*.webp.tmp.*' -mmin +10 -exec rm -f {} + 2>/dev/null || :

find "$PUBLIC_DIR" -type f -mmin +1 \
  \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) \
  | {
    converted=0
    while IFS= read -r f; do
      is_jpeg=0
      case "$f" in
        *.[jJ][pP][gG]|*.[jJ][pP][eE][gG]) is_jpeg=1 ;;
      esac

      if [ -s "$f.webp" ]; then                   # already has a real companion
        if [ "$RECHECK_JPEG" = 1 ] && [ "$is_jpeg" = 1 ] && [ "$HAVE_PERL" = 1 ] \
           && jpeg_needs_rotation "$f"; then
          rm -f "$f.webp"
          mark_skip "$f"
          echo "webp: removed rotated companion of $f"
        fi
        continue
      fi

      skip_marked "$f" && continue

      if [ "$is_jpeg" = 1 ]; then
        [ "$HAVE_PERL" = 1 ] || continue
        if jpeg_needs_rotation "$f"; then
          mark_skip "$f"
          echo "webp: skip $f (JPEG EXIF orientation is not 1 or cannot be read)"
          continue
        fi
      fi

      tmp="$f.webp.tmp.$$"
      if cwebp -quiet -q "$QUALITY" "$f" -o "$tmp" >/dev/null 2>&1 \
         && [ -s "$tmp" ] && mv -f "$tmp" "$f.webp"; then
        rm -f "$f.webp.skip"
        converted=$((converted + 1))
        echo "webp: $f"
      else
        rm -f "$tmp"
        mark_skip "$f"
        echo "webp: FAILED $f (original keeps being served; retried when it changes or in a day)" >&2
      fi
    done
    echo "done: $converted converted ($(date))"
  }
