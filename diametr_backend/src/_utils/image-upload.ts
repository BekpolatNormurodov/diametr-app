import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import axios, { AxiosResponse } from 'axios';
import { lookup as dnsLookup, promises as dnsPromises } from 'dns';
import { closeSync, openSync, readSync, unlinkSync, writeFileSync } from 'fs';
import { isIP } from 'net';
import { extname, join } from 'path';

/**
 * Shared helpers for the `/upload-image` (multipart) and `/upload-image-url`
 * routes of every controller that stores pictures under `public/<folder>`.
 */

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const UNSUPPORTED_IMAGE = "Rasm formati qo'llab-quvvatlanmaydi (JPG, PNG, WebP)";
const SVG_NOT_ALLOWED =
  "SVG rasmlar qabul qilinmaydi. JPG, PNG yoki WebP formatidagi rasm yuklang";
const NO_IMAGE = 'Rasm fayli yuborilmadi';
const INVALID_URL = "Rasm havolasi noto'g'ri (faqat http:// yoki https://)";
const BLOCKED_HOST = "Bu manzildan rasm yuklab bo'lmaydi";
const DOWNLOAD_FAILED = "Rasmni havoladan yuklab bo'lmadi";
const NOT_AN_IMAGE = 'Havola rasmga olib bormaydi';

// ─── Multipart upload ─────────────────────────────────────────────────────────

// No SVG: an SVG is a document that can carry scripts, and uploads are served
// from the API origin. Existing .svg files keep being served (nginx adds
// nosniff + a sandbox CSP on /static/), but new ones are refused.
const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif|bmp)$/i;
const SVG_NAME = /\.svgz?$/i;

function isSvgFile(file: { originalname?: string; mimetype?: string }): boolean {
  return (
    SVG_NAME.test(file.originalname ?? '') ||
    (file.mimetype ?? '').toLowerCase().includes('svg')
  );
}

const MARKUP_SNIFF_BYTES = 4096;

/**
 * 400 message when the first bytes are markup rather than a raster image (no
 * supported format — JPEG, PNG, GIF, WebP, BMP — starts with '<'): the SVG
 * message for an SVG, `otherwise` for any other markup (e.g. an HTML page).
 * null for a non-markup body.
 */
function markupRejection(head: Buffer, otherwise: string): string | null {
  let text = head.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (!/^\s*</.test(text)) return null;
  return /<svg[\s>/]/i.test(text) ? SVG_NOT_ALLOWED : otherwise;
}

// Browsers often hand over JPEGs as `.jfif`/`.pjpeg` or with no extension at
// all; accept them by MIME type and store them under a real extension.
const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/x-ms-bmp': '.bmp',
};

function storedExtension(file: {
  originalname?: string;
  mimetype?: string;
}): string | null {
  const name = file.originalname ?? '';
  if (ALLOWED_EXT.test(name)) return extname(name);
  return MIME_EXT[(file.mimetype ?? '').toLowerCase()] ?? null;
}

function uniqueName(ext: string): string {
  return Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
}

/** multer `fileFilter`: unsupported files fail with 400 instead of a 500. */
export function imageFileFilter(
  _req: any,
  file: { originalname: string; mimetype: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (isSvgFile(file)) {
    cb(new BadRequestException(SVG_NOT_ALLOWED), false);
  } else if (storedExtension(file)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(UNSUPPORTED_IMAGE), false);
  }
}

/** multer disk-storage `filename`. */
export function imageFileName(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
): void {
  cb(null, uniqueName(storedExtension(file) ?? extname(file.originalname)));
}

/** First bytes of a stored upload (empty buffer when unreadable). */
function readHead(path: string, bytes = MARKUP_SNIFF_BYTES): Buffer {
  let fd: number | undefined;
  try {
    fd = openSync(path, 'r');
    const buf = Buffer.alloc(bytes);
    const n = readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, n);
  } catch {
    return Buffer.alloc(0);
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Stored filename of the uploaded image; 400 when no file was sent, or when the
 * content is markup (e.g. an SVG renamed to .png) — that file is deleted.
 */
export function uploadedImageName(file: Express.Multer.File | undefined): string {
  if (!file?.filename) {
    throw new BadRequestException(NO_IMAGE);
  }
  const rejection = file.path
    ? markupRejection(readHead(file.path), UNSUPPORTED_IMAGE)
    : null;
  if (rejection) {
    try {
      unlinkSync(file.path);
    } catch {
      /* already gone */
    }
    throw new BadRequestException(rejection);
  }
  return file.filename;
}

// ─── Download from URL (SSRF-guarded) ─────────────────────────────────────────

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 15000;

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

// Loopback, private, link-local (incl. cloud metadata), CGNAT, documentation,
// benchmarking, multicast and reserved IPv4 ranges.
const BLOCKED_V4: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function isBlockedV4(n: number): boolean {
  return BLOCKED_V4.some(([base, bits]) => {
    const start = ipv4ToNumber(base) as number;
    return n >= start && n < start + 2 ** (32 - bits);
  });
}

function ipv6ToBytes(ip: string): number[] | null {
  let s = ip;
  const zone = s.indexOf('%');
  if (zone >= 0) s = s.slice(0, zone);

  // Trailing dotted IPv4 (e.g. ::ffff:127.0.0.1) → two placeholder groups.
  let tail: number[] | null = null;
  const lastColon = s.lastIndexOf(':');
  if (lastColon >= 0 && s.indexOf('.', lastColon) >= 0) {
    const v4 = ipv4ToNumber(s.slice(lastColon + 1));
    if (v4 == null) return null;
    tail = [
      Math.floor(v4 / 16777216) % 256,
      Math.floor(v4 / 65536) % 256,
      Math.floor(v4 / 256) % 256,
      v4 % 256,
    ];
    s = s.slice(0, lastColon + 1) + '0:0';
  }

  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  let groups: string[];
  if (halves.length === 2) {
    const fill = 8 - head.length - rest.length;
    if (fill < 0) return null;
    groups = [...head, ...new Array<string>(fill).fill('0'), ...rest];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    const v = parseInt(g, 16);
    bytes.push(Math.floor(v / 256), v % 256);
  }
  if (tail) bytes.splice(12, 4, ...tail);
  return bytes;
}

function v4At(b: number[], offset: number): number {
  return (
    b[offset] * 16777216 + b[offset + 1] * 65536 + b[offset + 2] * 256 + b[offset + 3]
  );
}

function isBlockedV6(b: number[]): boolean {
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d, incl. :: and ::1)
  if (b.slice(0, 10).every((x) => x === 0)) {
    if ((b[10] === 0xff && b[11] === 0xff) || (b[10] === 0 && b[11] === 0)) {
      return isBlockedV4(v4At(b, 12));
    }
    return true;
  }
  // Only global unicast (2000::/3) is reachable on the public internet; this
  // also rejects ULA fc00::/7, link-local fe80::/10, multicast ff00::/8 and
  // NAT64 64:ff9b::/96.
  if ((b[0] & 0xe0) !== 0x20) return true;
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return true; // 2001:db8::/32
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00) return true; // Teredo 2001::/32
  if (b[0] === 0x20 && b[1] === 0x02) return isBlockedV4(v4At(b, 2)); // 6to4
  return false;
}

/** True for any address a server-side fetch must never reach. Fails closed. */
function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const n = ipv4ToNumber(address);
    return n == null || isBlockedV4(n);
  }
  if (family === 6) {
    const bytes = ipv6ToBytes(address);
    return bytes == null || isBlockedV6(bytes);
  }
  return true;
}

function parseHttpUrl(raw: unknown): URL {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new BadRequestException(INVALID_URL);
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new BadRequestException(INVALID_URL);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException(INVALID_URL);
  }
  return url;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[/, '').replace(/\]$/, '');
  if (isIP(host)) {
    if (isBlockedAddress(host)) throw new BadRequestException(BLOCKED_HOST);
    return;
  }
  let addresses: { address: string }[];
  try {
    addresses = await dnsPromises.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new BadRequestException(DOWNLOAD_FAILED);
  }
  if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
    throw new BadRequestException(BLOCKED_HOST);
  }
}

/**
 * DNS lookup used for the actual connection, so a hostname that resolved to a
 * public address during the pre-check cannot be re-pointed (DNS rebinding) at
 * an internal one. IP-literal hosts never reach this; they are checked above.
 */
function publicOnlyLookup(
  hostname: string,
  options: any,
  cb: (
    err: Error | null,
    address: { address: string; family: 4 | 6 }[],
  ) => void,
): void {
  dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) return cb(err, []);
    if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
      return cb(new Error('Blocked address'), []);
    }
    const wanted = options?.family === 4 || options?.family === 6 ? options.family : 0;
    const entries: { address: string; family: 4 | 6 }[] = addresses
      .filter((a) => !wanted || a.family === wanted)
      .map((a) => ({ address: a.address, family: a.family === 6 ? 6 : 4 }));
    if (entries.length === 0) return cb(new Error('No usable address'), []);
    cb(null, entries);
  });
}

function detectImageExtension(body: Buffer, contentType: unknown): string | null {
  if (body.length === 0) return null;
  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return '.jpg';
  }
  if (
    body.length >= 8 &&
    body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return '.png';
  }
  const head = body.subarray(0, 12).toString('latin1');
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return '.gif';
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return '.webp';

  const type = typeof contentType === 'string' ? contentType.toLowerCase() : '';
  if (!type.startsWith('image/')) return null;
  if (head.startsWith('BM')) return '.bmp';
  // Any other image/* body is kept under .jpg, as this route always did.
  return '.jpg';
}

/**
 * Downloads an image from a user-supplied URL into `public/<folder>` and
 * returns the stored filename. Only http/https, only public addresses (checked
 * on every redirect hop and again at connect time), 15 MB / 15 s per request,
 * at most 3 redirects, and the body must be an image.
 */
export async function downloadImageFromUrl(
  rawUrl: unknown,
  folder: string,
): Promise<string> {
  let url = parseHttpUrl(rawUrl);

  for (let hop = 0; ; hop++) {
    await assertPublicHost(url.hostname);

    let response: AxiosResponse<ArrayBuffer>;
    try {
      response = await axios.get<ArrayBuffer>(url.toString(), {
        responseType: 'arraybuffer',
        maxContentLength: IMAGE_MAX_BYTES,
        maxBodyLength: IMAGE_MAX_BYTES,
        timeout: REQUEST_TIMEOUT_MS,
        maxRedirects: 0,
        proxy: false,
        lookup: publicOnlyLookup,
        validateStatus: (status) => status >= 200 && status < 400,
      });
    } catch {
      throw new BadRequestException(DOWNLOAD_FAILED);
    }

    if (response.status >= 300) {
      const location = response.headers['location'];
      if (typeof location !== 'string' || !location || hop >= MAX_REDIRECTS) {
        throw new BadRequestException(DOWNLOAD_FAILED);
      }
      let next: string;
      try {
        next = new URL(location, url).toString();
      } catch {
        throw new BadRequestException(DOWNLOAD_FAILED);
      }
      url = parseHttpUrl(next);
      continue;
    }

    const body = Buffer.from(response.data);
    const contentType = response.headers['content-type'];
    // An SVG served as image/svg+xml would otherwise be kept under .jpg.
    if (typeof contentType === 'string' && contentType.toLowerCase().includes('svg')) {
      throw new BadRequestException(SVG_NOT_ALLOWED);
    }
    const rejection = markupRejection(
      body.subarray(0, MARKUP_SNIFF_BYTES),
      NOT_AN_IMAGE,
    );
    if (rejection) {
      throw new BadRequestException(rejection);
    }
    const ext = detectImageExtension(body, contentType);
    if (!ext) {
      throw new BadRequestException(NOT_AN_IMAGE);
    }
    const filename = uniqueName(ext);
    writeFileSync(join(process.cwd(), 'public', folder, filename), body);
    return filename;
  }
}
