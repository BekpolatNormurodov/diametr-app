/**
 * One search normalization shared by every Diametr app (site, dashboard, shop admin, mobile, backend),
 * so Latin and Cyrillic Uzbek/Russian spellings find each other: "rakovina" finds "раковина",
 * "boyoq" finds "Бўёқ" / "bo'yoq", "sement" finds "Цемент". Digits are left untouched, so phone
 * numbers and ids are still found.
 *
 * Steps, in order (must stay identical in every app):
 *  1. null/undefined -> "", everything else -> String
 *  2. lowercase (full Unicode)
 *  3. Cyrillic -> Latin with CYR_TO_LAT (other characters kept)
 *  4. remove apostrophe-like glyphs  ' ‘ ’ ʻ ʼ ` ´
 *  5. "ts" -> "s"
 *  6. "h" -> "x"
 *  7. collapse whitespace runs to one space, trim
 */

const CYR_TO_LAT: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g", "ғ": "g", "д": "d", "е": "e", "ё": "yo",
  "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k", "қ": "q", "л": "l", "м": "m",
  "н": "n", "о": "o", "ў": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
  "ф": "f", "х": "x", "ҳ": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "",
  "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya",
};

const CYRILLIC_RE = /[\u0400-\u04FF]/g;
const APOSTROPHES_RE = /['\u2018\u2019\u02BB\u02BC`\u00B4]/g;

export function searchKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .replace(CYRILLIC_RE, (ch) => CYR_TO_LAT[ch] ?? ch)
    .replace(APOSTROPHES_RE, "")
    .replace(/ts/g, "s")
    .replace(/h/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when any field key contains the query key. An empty query key matches everything. */
export function matchesKeys(fieldKeys: readonly string[], queryKey: string): boolean {
  if (!queryKey) return true;
  return fieldKeys.some((k) => k.includes(queryKey));
}

/** Rows with their field keys computed once (build it in useMemo so typing does not recompute keys). */
export type SearchIndex<T> = { row: T; keys: string[] }[];

export function buildSearchIndex<T>(rows: readonly T[], fields: (row: T) => unknown[]): SearchIndex<T> {
  return rows.map((row) => ({ row, keys: fields(row).map((f) => searchKey(f)) }));
}

/** Rows of the index (in index order) where any field matches the query. */
export function filterSearchIndex<T>(index: SearchIndex<T>, query: string): T[] {
  const q = searchKey(query);
  return index.filter((e) => matchesKeys(e.keys, q)).map((e) => e.row);
}
