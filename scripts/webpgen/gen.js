const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ROOT = '/data';
const MAXW = 1080, Q = 82, CONC = 2;
// A source modified in the last minute may still be uploading — convert it next run.
const SETTLE_MS = 60 * 1000;
sharp.cache(false);
sharp.concurrency(1);

const files = [];
for (const d of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    // Leftover temp files from a run that was killed mid-write.
    if (/\.webp\.tmp-\d+$/.test(f)) {
      try { if (Date.now() - fs.statSync(full).mtimeMs > 10 * 60 * 1000) fs.unlinkSync(full); } catch (_) {}
      continue;
    }
    if (/\.(webp)$/i.test(f)) continue;
    if (!/\.(png|jpe?g)$/i.test(f)) continue;
    files.push(full);
  }
}
console.log(`found ${files.length} source images`);

let done=0, skipped=0, failed=0, inBytes=0, outBytes=0;
async function one(src) {
  const out = src + '.webp';
  const tmp = `${out}.tmp-${process.pid}`;
  try {
    const st = fs.statSync(src);
    if (Date.now() - st.mtimeMs < SETTLE_MS) { skipped++; return; }
    // Regenerate when missing, empty (a crash used to leave 0-byte files that
    // were then skipped forever and served as broken images), or older than src.
    if (fs.existsSync(out)) {
      const o = fs.statSync(out);
      if (o.size > 0 && o.mtimeMs >= st.mtimeMs) { skipped++; return; }
    }
    const buf = await sharp(src, {limitInputPixels: 400000000})
      .rotate()
      .resize({ width: MAXW, withoutEnlargement: true })
      .webp({ quality: Q, effort: 4 })
      .toBuffer();
    if (!buf || buf.length === 0) throw new Error('empty webp output');
    // Atomic publish: nginx serves `$uri.webp` as soon as the name exists, so the
    // name must only ever point at a complete file.
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, out);
    inBytes += st.size; outBytes += buf.length; done++;
    if (done % 25 === 0) console.log(`  ${done}/${files.length} ... ${(inBytes/1048576).toFixed(0)}MB -> ${(outBytes/1048576).toFixed(0)}MB`);
  } catch (e) {
    failed++; console.error(`FAIL ${src}: ${e.message}`);
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}
(async () => {
  for (let i=0;i<files.length;i+=CONC) await Promise.all(files.slice(i,i+CONC).map(one));
  console.log(`\nDONE converted=${done} skipped=${skipped} failed=${failed}`);
  console.log(`SIZE ${(inBytes/1048576).toFixed(1)} MB -> ${(outBytes/1048576).toFixed(1)} MB  (${inBytes?(inBytes/outBytes).toFixed(1):0}x smaller)`);
})();
