/**
 * searchKey — the one search normalization shared by every Diametr app
 * (mobile, diametr.uz, shop admin, dashboard, backend). Keep it identical to
 * the other implementations so Latin and Cyrillic spellings find each other:
 * "rakovina" ⇄ "раковина", "hammom" ⇄ "Ҳаммом", "boyoq" ⇄ "bo'yoq" ⇄ "Бўёқ".
 *
 * Steps, in order:
 *   1. null/undefined -> "", everything else -> String(value)
 *   2. lowercase (full Unicode, so Cyrillic capitals are lowered too)
 *   3. transliterate Cyrillic with CYR_TO_LAT (other chars kept as-is)
 *   4. drop apostrophe-like glyphs  ' ‘ ’ ʻ ʼ ` ´
 *   5. "ts" -> "s"
 *   6. "h"  -> "x"
 *   7. collapse whitespace runs to one space and trim
 *
 * Digits are untouched, so phones / ids / INNs are still found.
 * A record matches when searchKey(field) includes searchKey(query) for ANY of
 * its searchable fields; an empty query key matches everything.
 */

const CYR_TO_LAT: { readonly [ch: string]: string } = {
  "а": "a",
  "б": "b",
  "в": "v",
  "г": "g",
  "ғ": "g",
  "д": "d",
  "е": "e",
  "ё": "yo",
  "ж": "j",
  "з": "z",
  "и": "i",
  "й": "y",
  "к": "k",
  "қ": "q",
  "л": "l",
  "м": "m",
  "н": "n",
  "о": "o",
  "ў": "o",
  "п": "p",
  "р": "r",
  "с": "s",
  "т": "t",
  "у": "u",
  "ф": "f",
  "х": "x",
  "ҳ": "h",
  "ц": "ts",
  "ч": "ch",
  "ш": "sh",
  "щ": "sh",
  "ъ": "",
  "ы": "i",
  "ь": "",
  "э": "e",
  "ю": "yu",
  "я": "ya",
};

const hasOwn = Object.prototype.hasOwnProperty;

// U+0027 ' , U+2018 ‘ , U+2019 ’ , U+02BB ʻ , U+02BC ʼ , U+0060 ` , U+00B4 ´
const APOSTROPHES_RE = /['‘’ʻʼ`´]/g;

/** Normalize a value for Latin/Cyrillic-insensitive search (see file header). */
export function searchKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  const lower = String(value).toLowerCase();
  let out = "";
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += hasOwn.call(CYR_TO_LAT, ch) ? CYR_TO_LAT[ch] : ch;
  }
  return out
    .replace(APOSTROPHES_RE, "")
    .replace(/ts/g, "s")
    .replace(/h/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * Field keys are cached by their raw string so a list filtered on every
 * keystroke only normalizes each record once. Bounded: cleared when full.
 */
const KEY_CACHE_MAX = 20000;
const keyCache = new Map<string, string>();

/** searchKey() with a per-string cache — use for record fields in filters. */
export function cachedSearchKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  let key = keyCache.get(raw);
  if (key === undefined) {
    if (keyCache.size >= KEY_CACHE_MAX) keyCache.clear();
    key = searchKey(raw);
    keyCache.set(raw, key);
  }
  return key;
}

/**
 * True when any field's key contains `queryKey`.
 * `queryKey` must already be searchKey(query) — compute it once per filter,
 * not per record. An empty query key matches everything.
 */
export function matchesSearchKey(queryKey: string, fields: ReadonlyArray<unknown>): boolean {
  if (queryKey === "") return true;
  for (let i = 0; i < fields.length; i++) {
    if (cachedSearchKey(fields[i]).includes(queryKey)) return true;
  }
  return false;
}
