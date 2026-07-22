/**
 * Generates a "<file>.webp" companion next to every uploaded image.
 *
 * Why this exists: uploads are stored at full camera resolution — measured on
 * production, 387 images averaging 5.9 MB, p50 7.5 MB, max 10.2 MB, 364 of them
 * PNG with no alpha channel. A category screen pulled ~168 MB of images.
 * The companions total ~51 MB for the same 387 files (43x smaller), and nginx
 * hands them to any client advertising WebP support (see `location /static/`).
 *
 * Deliberately a separate pass rather than an upload-time hook:
 *   - uploads stay fast, and a conversion failure can never fail an upload
 *   - it is idempotent, so it doubles as a backfill for existing images
 *   - it needs no backend rebuild
 * The trade-off is that a brand-new image serves at full size until the next
 * run (cron: every 3 minutes).
 *
 * Originals are never modified or deleted — that is the rollback path.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.IMAGE_ROOT || '/data';
const MAX_WIDTH = Number(process.env.WEBP_MAX_WIDTH || 1080);
const QUALITY = Number(process.env.WEBP_QUALITY || 82);
const CONCURRENCY = Number(process.env.WEBP_CONCURRENCY || 2);

// The production box has 1.9 GB of RAM and runs MySQL + 2 backend replicas.
// Keep sharp from holding decoded frames around.
sharp.cache(false);
sharp.concurrency(1);

function collect() {
  const out = [];
  for (const entry of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, entry);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (/\.webp$/i.test(file)) continue;
      if (!/\.(png|jpe?g)$/i.test(file)) continue;
      out.push(path.join(dir, file));
    }
  }
  return out;
}

let converted = 0, skipped = 0, failed = 0, inBytes = 0, outBytes = 0;

async function convert(src) {
  const dest = src + '.webp';
  try {
    const stat = fs.statSync(src);
    // Re-run only when the source is newer than its companion.
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= stat.mtimeMs) {
      skipped++;
      return;
    }
    const buf = await sharp(src, { limitInputPixels: 400000000 })
      .rotate()                                             // honour EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toBuffer();

    // Write to a temp file and rename, so nginx never sees a partial file.
    const tmp = dest + '.tmp';
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, dest);

    inBytes += stat.size;
    outBytes += buf.length;
    converted++;
    if (converted % 25 === 0) {
      console.log(`  ${converted} converted — ${(inBytes / 1048576).toFixed(0)}MB -> ${(outBytes / 1048576).toFixed(0)}MB`);
    }
  } catch (err) {
    failed++;
    console.error(`FAIL ${src}: ${err.message}`);
  }
}

(async () => {
  const files = collect();
  console.log(`found ${files.length} source images in ${ROOT}`);
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    await Promise.all(files.slice(i, i + CONCURRENCY).map(convert));
  }
  console.log(`\nDONE converted=${converted} skipped=${skipped} failed=${failed}`);
  if (inBytes > 0) {
    console.log(`SIZE ${(inBytes / 1048576).toFixed(1)} MB -> ${(outBytes / 1048576).toFixed(1)} MB (${(inBytes / outBytes).toFixed(1)}x smaller)`);
  }
  // Surface failures to cron/CI without aborting a partially successful run.
  process.exit(failed > 0 ? 1 : 0);
})();
